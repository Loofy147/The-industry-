/**
 * The EventStore now acts as a durable log for events that pass through the Message Bus.
 * It subscribes to all event types to build a complete history.
 */
class EventStore {
  constructor(messageBus) {
    this.streams = new Map();
    this.messageBus = messageBus;
  }

  /**
   * Subscribes to all relevant topics on the message bus.
   * This is a simplified approach. A real system might have a more robust
   * mechanism for discovering all event types.
   */
  subscribeToAllEvents() {
    // This is a simplified approach. A real system might have a more robust
    // mechanism for discovering all event types.
    this.messageBus.subscribe('*', this._handleEvent.bind(this));
  }

  /**
   * Private handler that appends any received event to the appropriate stream.
   * @param {object} event The event to append.
   */
  _handleEvent(event) {
    const aggregateId = event.aggregateId;
    if (!this.streams.has(aggregateId)) {
      this.streams.set(aggregateId, []);
    }
    const stream = this.streams.get(aggregateId);
    stream.push(event);
    console.log(`EventStore: Persisted event for stream ${aggregateId}:`, event.type);
  }

  /**
   * Reads all events for a given aggregate.
   * @param {string} aggregateId The ID of the aggregate.
   * @returns {Array<object>} A list of all events for the aggregate.
   */
  readStream(aggregateId) {
    return this.streams.get(aggregateId) || [];
  }

  /**
   * Reads all events from all streams. Useful for projectors.
   * @returns {Array<object>} A list of all events.
   */
  readAllEvents() {
    let allEvents = [];
    for (const stream of this.streams.values()) {
      allEvents = allEvents.concat(stream);
    }
    return allEvents;
  }
}

// The eventStore is no longer a standalone singleton, but depends on the bus.
// We will manage its instantiation in a central setup file or test.
module.exports = {
  EventStore,
};
