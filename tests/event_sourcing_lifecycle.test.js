const request = require('supertest');
const { server, userReadModelProjector: serverProjector } = require('../server');
const { eventStore } = require('../src/event_store');
const { MessageBus } = require('../src/message_bus');
const { User } = require('../src/user_aggregate');
const { UserRepository } = require('../src/user_repository');
const { snapshotStore } = require('../src/snapshot_store');

describe('Event Sourcing Lifecycle Management', () => {
  let userRepository;

  beforeEach(() => {
    userRepository = new UserRepository(eventStore);

    // Clear stores before each test
    eventStore.clear();
    snapshotStore.db.clear();
    serverProjector.clear();
  });

  it('should create and use snapshots for performance', async () => {
    const user = new User();
    const aggregateId = 'snapshot-test-user';
    user._id = aggregateId;

    // Generate 15 events, saving after each one
    for (let i = 0; i < 15; i++) {
      const event = user._createEvent('UserUpdated', { iteration: i });
      user.apply(event);
      eventStore._handleEvent(event); // Manually add to store for this test
      await userRepository.save(user, [event]);
    }

    // Verify snapshot was created
    const snapshot = snapshotStore.get(aggregateId);
    expect(snapshot).toBeDefined();
    expect(snapshot.version).toBe(9);

    // Verify that loading from the repository uses the snapshot
    const readStreamSpy = jest.spyOn(eventStore, 'readStream');
    const rehydratedUser = await userRepository.findById(aggregateId);
    expect(rehydratedUser.version).toBe(14);

    // The spy should have been called, but the filter should only pass events after the snapshot version
    const eventsPassedToApply = readStreamSpy.mock.results[0].value;
    expect(eventsPassedToApply.filter(e => e.version > snapshot.version)).toHaveLength(5);
  });

  it('should allow a corrupted read model to be rebuilt via the Replay API', async () => {
    // Arrange: Create a user
    const user = new User();
    const event = user.registerUser({ email: 'replay-test@example.com', password: 'password123' });
    eventStore._handleEvent(event);

    // Project the initial state
    serverProjector.project(eventStore.readAllEvents());
    let userFromReadModel = serverProjector.findUserById(event.aggregateId);
    expect(userFromReadModel.email).toBe('replay-test@example.com');

    // Act 1: Manually corrupt the read model to simulate a bug
    serverProjector.readModel.set(event.aggregateId, {
      id: event.aggregateId,
      email: 'CORRUPTED_DATA',
    });
    userFromReadModel = serverProjector.findUserById(event.aggregateId);
    expect(userFromReadModel.email).toBe('CORRUPTED_DATA');

    // Act 2: Trigger a replay via the Control API
    await request(server).post('/control/projectors/UserReadModel/replay').expect(200);

    // Assert: The read model should now be corrected
    const userFromReadModelAfterReplay = serverProjector.findUserById(event.aggregateId);
    expect(userFromReadModelAfterReplay.email).toBe('replay-test@example.com');
  });
});
