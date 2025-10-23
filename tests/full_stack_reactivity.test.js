const WebSocket = require('ws');
const server = require('../server'); // Our frontend server
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
      // The connection is open, now we can proceed.

      // 2. The client sets up a listener for incoming messages.
      wsClient.on('message', (data) => {
        const event = JSON.parse(data);

        // 4. Assert that the received event is correct.
        expect(event.type).toBe('UserRegistered');
        expect(event.data.email).toBe(email);

        // Clean up and finish the test.
        wsClient.close();
        done();
      });

      // 3. Dispatch a command to the backend. This simulates a user action.
      // In a real app, this would be an HTTP POST request. Here, we call the command handler directly.
      await userLogic.registerUser(email, password);
    });

    wsClient.on('error', (err) => {
      done(err); // Fail the test if the connection fails
    });
  });
});
