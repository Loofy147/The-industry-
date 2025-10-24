const {
  User
} = require('./user_aggregate');
/**
 * The UserRepository is now an "Aggregate Repository".
 * Its *only* responsibility is to load aggregates from their event history.
 * It no longer saves events; that is handled by publishing to the message bus
 * and having the EventStore subscribe to it.
 */
class UserRepository {
  constructor(eventStore) {
    this.eventStore = eventStore;
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

// The repository is no longer a singleton, as it depends on the event store.
module.exports = {
  UserRepository,
};
