const { StatefulWebServer } = require('../src/stateful_web_server');
const { StatelessWebServer } = require('../src/stateless_web_server');
const { stateManager, clearExternalStore } = require('../src/state_manager');

describe('State Management Architectural Gap', () => {

  describe('StatefulWebServer (Flawed Implementation)', () => {
    test('loses state when a request is routed to a different server instance', () => {
      // Simulate a load-balanced environment with two separate server instances.
      const server1 = new StatefulWebServer();
      const server2 = new StatefulWebServer();

      // 1. A user's first request hits server 1 and creates a session.
      const response1 = server1.handleRequest({ action: 'CREATE_SESSION' });
      const sessionId = response1.sessionId;
      expect(sessionId).toBeDefined();
      expect(response1.data.cart).toEqual([]);

      // 2. The user adds an item to their cart, and the request also hits server 1.
      const response2 = server1.handleRequest({ sessionId, action: 'ADD_TO_CART', data: { item: 'Laptop' } });
      expect(response2.data.cart).toEqual(['Laptop']);

      // 3. The load balancer now routes the user's next request to server 2.
      // CRITICAL FAILURE: Server 2 has no knowledge of the user's session.
      const response3 = server2.handleRequest({ sessionId, action: 'GET_CART' });
      expect(response3.error).toBe('Session not found');
      expect(response3.status).toBe(404);
    });
  });

  describe('StatelessWebServer (Correct Implementation)', () => {

    beforeEach(() => {
      // Clear the shared, external state before each test.
      clearExternalStore();
    });

    test('maintains state correctly when requests are routed to different server instances', async () => {
      // Simulate a load-balanced environment with two stateless servers sharing a single state manager.
      const server1 = new StatelessWebServer(stateManager);
      const server2 = new StatelessWebServer(stateManager);

      // 1. A user's first request hits server 1 and creates a session in the external store.
      const response1 = await server1.handleRequest({ action: 'CREATE_SESSION' });
      const sessionId = response1.sessionId;
      expect(sessionId).toBeDefined();
      expect(response1.data.cart).toEqual([]);

      // 2. The user adds an item to their cart. The request hits server 1, which updates the external store.
      const response2 = await server1.handleRequest({ sessionId, action: 'ADD_TO_CART', data: { item: 'Laptop' } });
      expect(response2.data.cart).toEqual(['Laptop']);

      // 3. The load balancer now routes the user's next request to server 2.
      // SUCCESS: Server 2 fetches the session from the shared external store and finds the correct data.
      const response3 = await server2.handleRequest({ sessionId, action: 'GET_CART' });
      expect(response3.error).toBeUndefined();
      expect(response3.data.cart).toEqual(['Laptop']);
    });
  });
});
