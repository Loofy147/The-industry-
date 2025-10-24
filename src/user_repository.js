const {
  User
} = require('./user_aggregate');
/**
 * The UserRepository is now an "Aggregate Repository".
 * Its *only* responsibility is to load aggregates from their event history.
 * It no longer saves events; that is handled by publishing to the message bus
 * and having the EventStore subscribe to it.
 */
const { snapshotStore } = require('./snapshot_store');

const SNAPSHOT_INTERVAL = 10; // Create a snapshot every 10 events

class UserRepository {
  constructor(eventStore) {
    this.eventStore = eventStore;
  }

  /**
   * Loads a User aggregate from its event history, using a snapshot if available.
   * @param {string} aggregateId The ID of the user to load.
   * @returns {Promise<User|null>} The hydrated User aggregate or null if not found.
   */
  async findById(aggregateId) {
    const user = new User();
    let startingVersion = -1;

    // 1. Try to load from a snapshot
    const snapshot = snapshotStore.get(aggregateId);
    if (snapshot) {
      user.loadFromSnapshot(snapshot);
      startingVersion = snapshot.version;
    }

    // 2. Load events since the snapshot
    const events = this.eventStore.readStream(aggregateId)
      .filter(event => event.version > startingVersion);

    if (!snapshot && events.length === 0) {
      return null; // Not found
    }

    // 3. Apply the new events
    events.forEach(event => user.apply(event));

    return user;
  }

  /**
   * Saves an aggregate and potentially creates a snapshot.
   * @param {User} aggregate The aggregate to save.
   * @param {Array<object>} newEvents The new events to be published.
   */
  async save(aggregate, newEvents) {
    // This method would typically publish events to the message bus.
    // For this example, we'll focus on the snapshotting logic.

    const lastEvent = newEvents[newEvents.length - 1];
    if (lastEvent && lastEvent.version > 0 && (lastEvent.version + 1) % SNAPSHOT_INTERVAL === 0) {
      snapshotStore.save(aggregate._id, {
        version: aggregate.version,
        state: aggregate.getState(),
      });
    }
  }
}

// The repository is no longer a singleton, as it depends on the event store.
module.exports = {
  UserRepository,
};
