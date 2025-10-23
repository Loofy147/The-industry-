class EventStore {
  constructor() {
    // In-memory store for events, grouped by aggregate ID.
    // In a real application, this would be a dedicated event store database like EventStoreDB or a table in a relational/NoSQL database.
    this.streams = new Map();
  }

  /**
   * Appends an event to the stream for a given aggregate.
   * @param {string} aggregateId The ID of the aggregate.
   * @param {object} event The event object to append.
   */
  appendToStream(aggregateId, event) {
    if (!this.streams.has(aggregateId)) {
      this.streams.set(aggregateId, []);
    }
    const stream = this.streams.get(aggregateId);
    stream.push(event);
    console.log(`Event appended to stream ${aggregateId}:`, event);
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

const eventStore = new EventStore();

module.exports = {
  EventStore,
  eventStore,
};
