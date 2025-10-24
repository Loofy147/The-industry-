/**
 * The UserReadModelProjector is responsible for building and maintaining a denormalized
 * read model from the stream of events. This is the "Query" side of CQRS.
 *
 * It subscribes to events from the EventStore and updates a simple key-value
 * store that is optimized for fast reads.
 */
class UserReadModelProjector {
  constructor(eventStore, projectorManager) {
    this.eventStore = eventStore;
    // In a real application, this would be a separate read database (e.g., Redis, Elasticsearch, or a SQL table).
    this.readModel = new Map();

    if (projectorManager) {
      projectorManager.register('UserReadModel', this);
    }
  }

  /**
   * Rebuilds the read model from a given stream of events.
   * @param {Array<object>} events The events to project.
   */
  project(events) {
    events.forEach(event => this._apply(event));
  }

  /**
   * Applies a single event to the read model.
   * This is how the model is kept up-to-date in real-time.
   * @param {object} event The event to apply.
   */
  _apply(event) {
    if (event.type === 'UserRegistered') {
      this.readModel.set(event.aggregateId, {
        id: event.aggregateId,
        email: event.data.email,
        // NOTE: We deliberately do not include the password in the read model.
        // Read models should be tailored to specific query needs.
      });
    }
  }

  /**
   * Retrieves a user from the read model. This is the fast query method.
   * @param {string} userId The ID of the user to retrieve.
   */
  findUserById(userId) {
    return this.readModel.get(userId);
  }

  /**
   * Clears the read model.
   */
  clear() {
    this.readModel.clear();
    console.log('UserReadModelProjector: Read model cleared.');
  }
}

module.exports = { UserReadModelProjector };
