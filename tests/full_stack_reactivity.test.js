const WebSocket = require('ws');
// server.js is no longer imported or managed by the test.
// const server = require('../server');
const { WebSocketGateway } = require('../src/websocket_gateway');
const { MessageBus } = require('../src/message_bus');
const { UserLogic } = require('../systems/user_service/user_logic');
const { UserRepository } = require('../src/user_repository');
const { EventStore } = require('../src/event_store');

describe('Full-Stack, End-to-End Reactivity Test', () => {
  let wsGateway;
  let userLogic;
  let messageBus;

  beforeEach(() => {
    // Set up a fresh backend infrastructure for each test.
    messageBus = new MessageBus();
    const eventStore = new EventStore(messageBus);
    const userRepository = new UserRepository(eventStore);
    userLogic = new UserLogic(userRepository, messageBus);
    // The test will use the same port as the main server.
    wsGateway = new WebSocketGateway(messageBus, 8080);

    // Connect the components.
    eventStore.subscribeToAllEvents();
    wsGateway.start();
  });

  afterEach(() => {
    // Stop the gateway after each test.
    wsGateway.stop();
  });

  it('should push a UserRegistered event to a connected client when a user is registered', (done) => {
    const email = 'full-stack-test@example.com';
    const password = 'a-secure-password';

    // 1. Simulate a frontend client connecting to the WebSocket gateway.
    const wsClient = new WebSocket('ws://localhost:8080');

    wsClient.on('open', async () => {
      wsClient.on('message', (data) => {
        const event = JSON.parse(data);
        expect(event.type).toBe('UserRegistered');
        expect(event.data.email).toBe(email);
        wsClient.close();
        done();
      });

      // 3. Dispatch a command to the backend.
      await userLogic.registerUser(email, password);
    });

    wsClient.on('error', (err) => {
      done(err);
    });
  });
});
