const supertest = require('supertest');
const { server } = require('../server');
const { config } = require('../src/config_loader');
const getPort = require('get-port-cjs');

let request;
let testPort;

const { start: startApiGateway } = require('../src/api_gateway');
const { generateToken } = require('../src/auth');
let apiGatewayServer;
let authToken;

describe('Integration Tests', () => {
  beforeAll(async () => {
    testPort = await getPort();
    config.apiGatewayPort = testPort;
    apiGatewayServer = startApiGateway();
    request = supertest(`http://localhost:${testPort}`);
    authToken = generateToken({ userId: 'test-user' });
  });

  afterAll((done) => {
    apiGatewayServer.close(done);
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

  it('should deactivate a user', async () => {
    const registerResponse = await request.post('/users')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ email: 'test-deactivate@example.com', password: 'password' });
    const userId = registerResponse.body.userId;

    const deactivateResponse = await request.delete(`/users/${userId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(deactivateResponse.status).toBe(204);
  });
});
