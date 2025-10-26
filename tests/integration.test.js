const supertest = require('supertest');
const { server } = require('../server');
const { config } = require('../src/config_loader');
const getPort = require('get-port-cjs');

let request;
let testPort;

const { app } = require('../src/api_gateway');
const { generateToken } = require('../src/auth');
const { clear } = require('../src/config_loader');
let authToken;

describe('Integration Tests', () => {
  beforeAll(() => {
    clear();
    process.env.JWT_SECRET = 'test-secret-key';
    request = supertest(app);
    authToken = generateToken({ userId: 'test-user', role: 'customer' });
  });

  it('should respond to the health check', async () => {
    const response = await request.get('/healthz');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('should register a new user', async () => {
    const response = await request.post('/users')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ email: 'test@example.com', password: 'password' });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('userId');
  });

  it('should send a test notification', async () => {
    const response = await request.post('/notifications')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ email: 'test@example.com' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Welcome email sent.' });
  });

  it('should prevent a non-admin from deactivating a user', async () => {
    const registerResponse = await request.post('/users')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ email: 'test-deactivate@example.com', password: 'password', role: 'customer' });
    const userId = registerResponse.body.userId;

    const deactivateResponse = await request.delete(`/users/${userId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(deactivateResponse.status).toBe(403);
  });

  it('should allow an admin to deactivate a user', async () => {
    const adminToken = generateToken({ userId: 'admin-user', role: 'admin' });
    const registerResponse = await request.post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'test-deactivate-admin@example.com', password: 'password', role: 'customer' });
    const userId = registerResponse.body.userId;

    const deactivateResponse = await request.delete(`/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deactivateResponse.status).toBe(204);
  });
});
