const WebSocket = require('ws');
// server.js is no longer imported or managed by the test.
// const server = require('../server');
const { WebSocketGateway } = require('../src/websocket_gateway');
const { MessageBus } = require('../src/message_bus');
const { UserLogic } = require('../systems/user_service/user_logic');
const { UserRepository } = require('../src/user_repository');
const { EventStore } = require('../src/event_store');
const getPort = require('get-port-cjs');

describe('Full-Stack, End-to-End Reactivity Test', () => {
  let wsGateway;
  let userLogic;
  let port;

  beforeAll(async () => {
    // Dynamically allocate an available port.
    port = await getPort();

    // Create a fresh, isolated MessageBus for this test suite.
    const messageBus = new MessageBus();
    const eventStore = new EventStore(messageBus);
    const userRepository = new UserRepository(eventStore);
    userLogic = new UserLogic(userRepository, messageBus);
    wsGateway = new WebSocketGateway(messageBus, port);

    // Subscribe the gateway BEFORE the event store to ensure it receives the event.
    wsGateway.start();
    eventStore.subscribeToAllEvents();
  });

  afterAll(async () => {
    // Stop the server once after all tests are done.
    await wsGateway.stop();
  });

  it('should push a UserRegistered event to a connected client when a user is registered', (done) => {
    const email = 'full-stack-test@example.com';
    const password = 'a-secure-password';

    // 1. Simulate a frontend client connecting to the WebSocket gateway.
    const wsClient = new WebSocket(`ws://localhost:${port}`);

    wsClient.on('open', async () => {
      console.log('Test Client: WebSocket connection opened.');
      wsClient.on('message', (data) => {
        console.log('Test Client: Received message:', data.toString());
        const event = JSON.parse(data);
        expect(event.type).toBe('UserRegistered');
        expect(event.data.email).toBe(email);
        wsClient.close();
      });

      wsClient.on('close', () => {
        done();
      });

      // Add a small delay to ensure the server has processed the connection
      // before the event is fired.
      setTimeout(async () => {
        // 3. Dispatch a command to the backend.
        await userLogic.registerUser(email, password);
      }, 100);
    });

    wsClient.on('error', (err) => {
      console.error('Test Client: WebSocket error:', err);
      done(err);
    });
  });
});
