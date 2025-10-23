const {
  User
} = require('./user_aggregate');
const {
  eventStore
} = require('./event_store');

/**
 * The UserRepository is now an "Aggregate Repository".
 * Its responsibility is to load aggregates from their event history
 * and save new events back to the event store.
 * It is a bridge between the domain model (the aggregate) and the persistence layer (the event store).
 */
class UserRepository {
  constructor(eventStore) {
    this.eventStore = eventStore;
  }

  /**
   * Saves an event to the event store.
   * In a real system, this would happen within a transaction to ensure consistency.
   * @param {object} event The event to save.
   */
  async save(event) {
    this.eventStore.appendToStream(event.aggregateId, event);
  }

  /**
   * Loads a User aggregate from its event history.
   * @param {string} aggregateId The ID of the user to load.
   * @returns {User} The hydrated User aggregate.
   */
  async findById(aggregateId) {
    const events = this.eventStore.readStream(aggregateId);
    if (events.length === 0) {
      return null;
    }

    const user = new User();
    events.forEach(event => user.apply(event));
    return user;
  }
}

const userRepository = new UserRepository(eventStore);

module.exports = {
  UserRepository,
  userRepository
};