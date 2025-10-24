const request = require('supertest');
const { server } = require('../server');
const { serviceRegistry } = require('../src/service_registry');

describe('Service Registry and Architectural Introspection', () => {
  it('should discover and register all service manifests', () => {
    const services = serviceRegistry.getAll();
    expect(services.has('user_service')).toBe(true);
    expect(services.has('notification_service')).toBe(true);
  });

  it('should expose the registered services via the /control/services API endpoint', async () => {
    const response = await request(server).get('/control/services');
    expect(response.status).toBe(200);

    const services = response.body;
    expect(services).toBeInstanceOf(Array);
    expect(services).toHaveLength(2);

    const userService = services.find(s => s.name === 'user_service');
    const notificationService = services.find(s => s.name === 'notification_service');

    expect(userService).toBeDefined();
    expect(userService.publishes).toHaveLength(2);

    expect(notificationService).toBeDefined();
    expect(notificationService.subscribes).toHaveLength(1);
    expect(notificationService.subscribes[0].event).toBe('UserRegistered');
  });
});
