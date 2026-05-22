const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createOrder = async (req, res) => {
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
};

exports.getActiveOrders = async (req, res) => {
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
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: { items: true, user: { select: { username: true, role: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
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

    if (status === 'READY' && order.customerPhone) {
      console.log(`📱 SMS: Order ${order.orderNumber} ready! ${order.customerPhone}`);
    }

    res.json({ message: `Order status updated to ${status}`, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTodayStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [activeCount, completedToday, totalRevenue] = await Promise.all([
      prisma.order.count({ where: { status: { in: ['PENDING', 'PREPARING', 'READY'] } } }),
      prisma.order.count({ where: { status: 'COMPLETED', completedAt: { gte: today, lt: tomorrow } } }),
      prisma.order.aggregate({
        where: { status: 'COMPLETED', completedAt: { gte: today, lt: tomorrow } },
        _sum: { total: true }
      })
    ]);

    res.json({ active: activeCount, completedToday, totalRevenue: totalRevenue._sum.total || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
