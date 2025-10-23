const {
  UserLogic
} = require('../src/user_logic');
const {
  UserRepository
} = require('../src/user_repository');
const {
  EventStore
} = require('../src/event_store');
const {
  UserReadModelProjector
} = require('../src/user_read_model_projector');

describe('CQRS and Event Sourcing End-to-End Flow', () => {
  let eventStore;
  let userRepository;
  let userLogic;
  let userReadModelProjector;

  beforeEach(() => {
    // Set up a fresh in-memory event store and all dependent components for each test.
    eventStore = new EventStore();
    userRepository = new UserRepository(eventStore);
    userLogic = new UserLogic(userRepository);
    userReadModelProjector = new UserReadModelProjector(eventStore);
  });

  it('should correctly process a command, save an event, and update the read model', async () => {
    const email = 'cqrs-test@example.com';
    const password = 'a-strong-password';

    // --- 1. The Command Side ---
    // Send the `registerUser` command to the command handler (UserLogic).
    const newUserId = await userLogic.registerUser(email, password);

    expect(newUserId).toBeDefined();

    // --- 2. The Event Store (Source of Truth) ---
    // Verify that the correct event was written to the event store.
    const stream = eventStore.readStream(newUserId);
    expect(stream).toHaveLength(1);

    const event = stream[0];
    expect(event.type).toBe('UserRegistered');
    expect(event.aggregateId).toBe(newUserId);
    expect(event.data.email).toBe(email);

    // --- 3. The Aggregate (Write Model) ---
    // Verify that we can reconstruct the aggregate from its history.
    const userFromHistory = await userRepository.findById(newUserId);
    expect(userFromHistory).toBeDefined();
    expect(userFromHistory._id).toBe(newUserId);
    expect(userFromHistory.email).toBe(email);
    expect(userFromHistory.isActive).toBe(true);
    expect(userFromHistory.version).toBe(0); // Version is 0 after 1 event

    // --- 4. The Read Model (Query Side) ---
    // Trigger the projector to update the read model.
    userReadModelProjector.project();

    // Verify that the read model contains the correct, denormalized data.
    const userFromReadModel = userReadModelProjector.findUserById(newUserId);
    expect(userFromReadModel).toBeDefined();
    expect(userFromReadModel.id).toBe(newUserId);
    expect(userFromReadModel.email).toBe(email);
    // Crucially, the read model does not contain sensitive data like the password.
    expect(userFromReadModel.password).toBeUndefined();
  });
});