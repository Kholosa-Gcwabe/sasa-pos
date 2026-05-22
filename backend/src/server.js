require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// ==================== MIDDLEWARE ====================
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true, role: true, isActive: true }
    });

    if (!user) return res.status(401).json({ error: 'User not found' });
    if (!user.isActive) return res.status(403).json({ error: 'Account deactivated' });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Requires ${roles.join(' or ')} role` });
    }
    next();
  };
};

// ==================== AUTH ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', time: new Date().toISOString() });
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      accessToken: token,
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

// ==================== ORDERS ====================
app.post('/api/orders', authenticate, authorize('Cashier', 'Manager'), async (req, res) => {
  try {
    const { items, customerPhone } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    const total = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
    
    const order = await prisma.order.create({
      data: {
        orderNumber,
        total,
        status: 'PENDING',
        customerPhone: customerPhone || null,
        createdBy: req.user.id,
        items: {
          create: items.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity || 1
          }))
        }
      },
      include: { items: true, user: { select: { username: true } } }
    });
    
    res.status(201).json({ message: 'Order created', order });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/active', authenticate, authorize('Chef', 'Manager'), async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: { in: ['PENDING', 'PREPARING', 'READY'] } },
      include: { items: true, user: { select: { username: true } } },
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }]
    });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders', authenticate, authorize('Manager'), async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: { items: true, user: { select: { username: true, role: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/orders/:id/status', authenticate, authorize('Chef', 'Manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData = { status };
    if (status === 'COMPLETED') updateData.completedAt = new Date();

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: { items: true, user: { select: { username: true } } }
    });
    
    // TODO: Send SMS notification when order is READY
    if (status === 'READY' && order.customerPhone) {
      console.log(`📱 SMS Alert: Order ${order.orderNumber} is ready! Notify customer at ${order.customerPhone}`);
      // Here you would integrate with an SMS service like Twilio
    }
    
    res.json({ message: `Order status updated to ${status}`, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/stats/today', authenticate, authorize('Manager'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [activeCount, completedToday, totalRevenue] = await Promise.all([
      prisma.order.count({ where: { status: { in: ['PENDING', 'PREPARING', 'READY'] } } }),
      prisma.order.count({ where: { status: 'COMPLETED', completedAt: { gte: today, lt: tomorrow } } }),
      prisma.order.aggregate({ where: { status: 'COMPLETED', completedAt: { gte: today, lt: tomorrow } }, _sum: { total: true } })
    ]);

    res.json({ active: activeCount, completedToday, totalRevenue: totalRevenue._sum.total || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== USERS ====================
app.get('/api/users', authenticate, authorize('Manager'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', authenticate, authorize('Manager'), async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user = await prisma.user.create({
      data: { username, password: hashedPassword, role },
      select: { id: true, username: true, role: true, isActive: true, createdAt: true }
    });
    
    res.status(201).json({ message: 'User created', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', authenticate, authorize('Manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role, isActive } = req.body;
    
    const user = await prisma.user.update({
      where: { id },
      data: { role, isActive },
      select: { id: true, username: true, role: true, isActive: true }
    });
    
    res.json({ message: 'User updated', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', authenticate, authorize('Manager'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== MENU ====================
app.get('/api/menu', authenticate, async (req, res) => {
  try {
    const items = await prisma.menuItem.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/menu', authenticate, authorize('Manager'), async (req, res) => {
  try {
    const { name, price, category, description } = req.body;
    const item = await prisma.menuItem.create({
      data: { name, price: parseFloat(price), category, description }
    });
    res.status(201).json({ message: 'Menu item created', item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/menu/:id', authenticate, authorize('Manager'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.menuItem.delete({ where: { id } });
    res.json({ message: 'Menu item deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== SERVE FRONTEND ====================
app.use(express.static(path.join(__dirname, '../../frontend')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🍽️ Sasa POS Server running on port ${PORT}`);
});
