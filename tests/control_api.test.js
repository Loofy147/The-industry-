const request = require('supertest');
const { server } = require('../server');
const { configService } = require('../src/config_service');
const { circuitBreakerRegistry } = require('../src/circuit_breaker_registry');
const { State } = require('../src/circuit_breaker');
const { EmailService, emailService } = require('../systems/notification_service/email_service');

describe('Control API', () => {
  let originalConfig;

  beforeEach(() => {
    // Store original config to restore it after tests
    originalConfig = { ...configService.get() };
  });

  afterEach(() => {
    // Restore original config
    configService.update(originalConfig);
  });

  describe('GET /control/config', () => {
    it('should return the current application configuration', async () => {
      const response = await request(server).get('/control/config');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('LOG_LEVEL');
      expect(response.body.API_TIMEOUT_MS).toBe(5000);
    });
  });

  describe('PATCH /control/config', () => {
    it('should dynamically update a configuration value', async () => {
      // Verify initial state
      expect(configService.get('API_TIMEOUT_MS')).toBe(5000);

      // Act: Update the config via the API
      const response = await request(server)
        .patch('/control/config')
        .send({ API_TIMEOUT_MS: 7500 });

      // Assert
      expect(response.status).toBe(200);
      expect(configService.get('API_TIMEOUT_MS')).toBe(7500);
    });
  });

  describe('GET /control/circuit-breakers', () => {
    it('should return the status of all registered circuit breakers', async () => {
      // Arrange: Trip the circuit breaker
      const originalSend = emailService.emailClient.send;
      emailService.emailClient.send = jest.fn().mockRejectedValue(new Error('Email client is down'));

      // Trip the breaker (default threshold is 3)
      for (let i = 0; i < 3; i++) {
        await emailService.sendWelcomeEmail('test@example.com').catch(() => {});
      }

      // Act: Get the status from the API
      const response = await request(server).get('/control/circuit-breakers');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('EmailService');
      expect(response.body.EmailService.state).toBe(State.OPEN);

      // Cleanup
      emailService.emailClient.send = originalSend;
    });
  });

  describe('GET /control/message-bus/dlq', () => {
    it('should return the contents of the dead letter queue', async () => {
      // This is a simple test; a more robust one would involve producing a malformed message.
      const response = await request(server).get('/control/message-bus/dlq');
      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
    });
  });
});
