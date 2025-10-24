const {
  UserLogic
} = require('../systems/user_service/user_logic');
const {
  UserRepository
} = require('../src/user_repository');
const {
  eventStore
} = require('../src/event_store');
const {
  UserReadModelProjector
} = require('../src/user_read_model_projector');
const {
  messageBus
} = require('../src/message_bus');

describe('CQRS and Event Sourcing with Message Bus', () => {
  let userRepository;
  let userLogic;
  let userReadModelProjector;

  beforeEach(() => {
    // 1. Set up the entire in-memory infrastructure.
    userRepository = new UserRepository(eventStore);
    userLogic = new UserLogic(userRepository, messageBus);
    userReadModelProjector = new UserReadModelProjector(eventStore, { register: () => {} });

    // 2. Connect the components.
    // The EventStore subscribes to the bus to persist all events.
    eventStore.subscribeToAllEvents();
    eventStore.clear();
  });

  it('should process a command, publish an event, persist it, and update the read model', async () => {
    const email = 'cqrs-bus-test@example.com';
    const password = 'a-strong-password';

    // --- 1. The Command ---
    const newUserId = await userLogic.registerUser(email, password);
    expect(newUserId).toBeDefined();

    // --- 2. The Event Store (Persistence) ---
    // The userLogic published an event, which the eventStore should have received and persisted.
    const stream = eventStore.readStream(newUserId);
    expect(stream).toHaveLength(1);
    const event = stream[0];
    expect(event.type).toBe('UserRegistered');
    expect(event.aggregateId).toBe(newUserId);

    // --- 3. The Read Model (Query Side) ---
    // The projector builds its model from the now-persisted events in the event store.
    userReadModelProjector.project(eventStore.readAllEvents());
    const userFromReadModel = userReadModelProjector.findUserById(newUserId);
    expect(userFromReadModel).toBeDefined();
    expect(userFromReadModel.id).toBe(newUserId);
    expect(userFromReadModel.email).toBe(email);
  });
});
