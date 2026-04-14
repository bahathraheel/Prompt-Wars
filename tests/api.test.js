const request = require('supertest');
const app = require('../server');

describe('API Tests', () => {
  it('GET /api/health should return operational', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe('operational');
  });

  it('GET /api/menu should return items', async () => {
    const res = await request(app).get('/api/menu');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  it('GET /api/stadium should return sections', async () => {
    const res = await request(app).get('/api/stadium');
    expect(res.statusCode).toEqual(200);
    expect(res.body.sections).toBeDefined();
  });
});
