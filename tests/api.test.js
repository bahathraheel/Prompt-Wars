const request = require('supertest');
const app = require('../server');

describe('EXO API Integration Tests', () => {
  
  describe('System Endpoints', () => {
    it('GET /api/health should return operational status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'operational');
      expect(res.body).toHaveProperty('uptime');
    });

    it('GET /api/checks should return historical checks', async () => {
      const res = await request(app).get('/api/checks');
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });

    it('GET /api/ai-insights should return Gemini-powered insights', async () => {
      const res = await request(app).get('/api/ai-insights');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('system', 'Gemini Pro');
      expect(res.body.insights.length).toBeGreaterThan(0);
    });
  });

  describe('Menu Endpoints', () => {
    it('GET /api/menu should return all items', async () => {
      const res = await request(app).get('/api/menu');
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('GET /api/menu?category=drinks should filter items', async () => {
      const res = await request(app).get('/api/menu?category=drinks');
      expect(res.statusCode).toEqual(200);
      res.body.forEach(item => {
        expect(item.category).toBe('drinks');
      });
    });

    it('GET /api/menu/:id should return a specific item', async () => {
      const res = await request(app).get('/api/menu/1');
      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toBe(1);
    });

    it('GET /api/menu/:id with invalid ID should return 400 or 404', async () => {
      const res = await request(app).get('/api/menu/999');
      expect(res.statusCode).toEqual(404);
    });
  });

  describe('Orders Endpoints', () => {
    let createdOrderId;

    it('POST /api/orders should create a new order', async () => {
      const orderData = {
        name: 'Test User',
        section: 'A1',
        items: [{ id: 1, quantity: 2 }, { id: 6, quantity: 1 }]
      };
      
      const res = await request(app)
        .post('/api/orders')
        .send(orderData);
        
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('orderNumber');
      expect(res.body.customerName).toBe('Test User');
      createdOrderId = res.body.id;
    });

    it('POST /api/orders with invalid data should fail', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({ items: [] });
        
      expect(res.statusCode).toEqual(400);
    });

    it('GET /api/orders should list orders', async () => {
      const res = await request(app).get('/api/orders');
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });

    it('PATCH /api/orders/:id should update status', async () => {
      const res = await request(app)
        .patch(`/api/orders/${createdOrderId}`)
        .send({ status: 'ready' });
        
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('ready');
    });
  });

  describe('Stadium Endpoints', () => {
    it('GET /api/stadium should return layout', async () => {
      const res = await request(app).get('/api/stadium');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('sections');
    });

    it('GET /api/restrooms should return live wait times', async () => {
      const res = await request(app).get('/api/restrooms');
      expect(res.statusCode).toEqual(200);
      expect(res.body[0]).toHaveProperty('waitTime');
    });
  });

  describe('Security & Auth', () => {
    it('POST /api/admin/login with correct credentials should succeed', async () => {
      const res = await request(app)
        .post('/api/admin/login')
        .send({ username: 'admin', password: 'exo2026' });
        
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
    });

    it('POST /api/admin/login with wrong credentials should fail', async () => {
      const res = await request(app)
        .post('/api/admin/login')
        .send({ username: 'admin', password: 'wrongpassword' });
        
      expect(res.statusCode).toEqual(401);
    });
  });
});
