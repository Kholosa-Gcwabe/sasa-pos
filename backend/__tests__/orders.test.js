const request = require('supertest');
const bcrypt = require('bcryptjs');
const { app } = require('../src/app');

describe('Orders API', () => {
  let managerToken, cashierToken, chefToken;

  beforeEach(async () => {
    const { prisma } = require('./setup');
    
    const manager = await prisma.user.create({
      data: {
        username: 'manager',
        password: await bcrypt.hash('pass', 12),
        role: 'Manager',
      },
    });
    const cashier = await prisma.user.create({
      data: {
        username: 'cashier',
        password: await bcrypt.hash('pass', 12),
        role: 'Cashier',
      },
    });
    const chef = await prisma.user.create({
      data: {
        username: 'chef',
        password: await bcrypt.hash('pass', 12),
        role: 'Chef',
      },
    });

    const [mRes, cRes, chRes] = await Promise.all([
      request(app).post('/api/auth/login').send({ username: 'manager', password: 'pass' }),
      request(app).post('/api/auth/login').send({ username: 'cashier', password: 'pass' }),
      request(app).post('/api/auth/login').send({ username: 'chef', password: 'pass' }),
    ]);

    managerToken = mRes.body.accessToken;
    cashierToken = cRes.body.accessToken;
    chefToken = chRes.body.accessToken;
  });

  describe('POST /api/orders', () => {
    it('should create order as cashier', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({
          items: [
            { name: 'Pap & Chakalaka', price: 45.00, quantity: 2 },
          ],
          customerPhone: '0821234567',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.total).toBe(90.00);
    });

    it('should reject empty items array', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({ items: [] });

      expect(res.status).toBe(400);
    });

    it('should reject chef creating orders', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${chefToken}`)
        .send({
          items: [{ name: 'Test', price: 10, quantity: 1 }],
        });

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/orders/:id/status', () => {
    it('should update status as chef', async () => {
      const createRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({
          items: [{ name: 'Test', price: 50, quantity: 1 }],
        });

      const orderId = createRes.body.data.id;

      const res = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${chefToken}`)
        .send({ status: 'PREPARING' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('PREPARING');
    });

    it('should reject invalid status', async () => {
      const createRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({
          items: [{ name: 'Test', price: 50, quantity: 1 }],
        });

      const res = await request(app)
        .put(`/api/orders/${createRes.body.data.id}/status`)
        .set('Authorization', `Bearer ${chefToken}`)
        .send({ status: 'INVALID_STATUS' });

      expect(res.status).toBe(400);
    });
  });
});
