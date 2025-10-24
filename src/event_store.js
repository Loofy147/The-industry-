const { FileDatabase } = require('./file_database');

/**
 * The EventStore now acts as a durable log for events that pass through the Message Bus.
 * It subscribes to all event types to build a complete history.
 */
const { messageBus } = require('./message_bus');

class EventStore {
  /**
   * Creates an instance of EventStore.
   * @param {MessageBus} messageBus The message bus to subscribe to.
   */
  constructor(messageBus) {
    this.db = new FileDatabase('db/event_store.json');
    this.messageBus = messageBus;
  }

  /**
   * Subscribes to all relevant topics on the message bus.
   * This is a simplified approach. A real system might have a more robust
   * mechanism for discovering all event types.
   */
  subscribeToAllEvents() {
    this.messageBus.subscribe('*', this._handleEvent.bind(this));
  }

  /**
   * Private handler that appends any received event to the appropriate stream.
   * @param {object} event The event to append.
   */
  _handleEvent(event) {
    const aggregateId = event.aggregateId;
    const streams = this.db.get('streams') || {};
    if (!streams[aggregateId]) {
      streams[aggregateId] = [];
    }
    streams[aggregateId].push(event);
    this.db.set('streams', streams);
    console.log(`EventStore: Persisted event for stream ${aggregateId}:`, event.type);
  }

  /**
   * Reads all events for a given aggregate.
   * @param {string} aggregateId The ID of the aggregate.
   * @returns {Array<object>} A list of all events for the aggregate.
   */
  /**
   * Reads all events for a given aggregate.
   * @param {string} aggregateId The ID of the aggregate.
   * @returns {Array<object>} A list of all events for the aggregate.
   */
  readStream(aggregateId) {
    const streams = this.db.get('streams') || {};
    return streams[aggregateId] || [];
  }

  /**
   * Reads all events from all streams. Useful for projectors.
   * @returns {Array<object>} A list of all events.
   */
  readAllEvents() {
    const streams = this.db.get('streams') || {};
    let allEvents = [];
    for (const stream of Object.values(streams)) {
      allEvents = allEvents.concat(stream);
    }
    return allEvents;
  }

  /**
   * Clears all events from the event store.
   */
  clear() {
    this.db.clear();
  }
}

const eventStore = new EventStore(messageBus);

module.exports = {
  EventStore,
  eventStore,
};
