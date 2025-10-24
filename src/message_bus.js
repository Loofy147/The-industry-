const { getContext, setContext, CorrelationContext } = require('./observability');
const { schemaValidator } = require('./schema_validator');
const { metricsService } = require('./metrics_service');
require('../schemas/user_registered'); // Ensure schemas are registered
require('../schemas/user_deactivated'); // Ensure schemas are registered

// Register message bus metrics
metricsService.registerCounter('message_bus_events_published_total', 'Total number of events published to the message bus.');

/**
 * A simple in-memory message bus for pub/sub and command-based communication.
 */
class MessageBus {
  /**
   * Creates a new MessageBus instance.
   */
  constructor() {
    this.subscriptions = new Map();
    this.queues = new Map();
    this.deadLetterQueue = []; // For messages that fail validation
  }

  /**
   * Subscribes a handler to a topic.
   * @param {string} topic The topic to subscribe to.
   * @param {Function} handler The handler function.
   * @param {number} schemaVersion The schema version the handler supports.
   */
  subscribe(topic, handler, schemaVersion = 1) { // Consumers can specify which version they support
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, []);
    }
    this.subscriptions.get(topic).push({ handler, schemaVersion });
  }

  /**
   * Publishes an event to a topic.
   * @param {string} topic The topic to publish to.
   * @param {object} event The event to publish.
   */
  publish(topic, event) {
    const context = getContext();
    const message = {
      context: context ? { traceId: context.traceId, spanId: context.spanId } : null,
      payload: event,
    };

    console.log(`MessageBus: Publishing event to topic "${topic}"`, message.payload);
    metricsService.incrementCounter('message_bus_events_published_total', { topic });

    const handlers = (this.subscriptions.get(topic) || []).concat(this.subscriptions.get('*') || []);

    handlers.forEach(({ handler, schemaVersion }) => {
      // --- Schema Validation ---
      const { valid, errors } = schemaValidator.validate(topic, schemaVersion, message.payload);
      if (!valid) {
        console.error(`MessageBus: Invalid event for topic "${topic}". Moving to DLQ.`, { errors });
        this.deadLetterQueue.push({ message, errors });
        return; // Do not process invalid message
      }
      // --- End Validation ---

      const parentContext = getContext();
      const messageContext = message.context ? new CorrelationContext(message.context.traceId, message.context.spanId) : null;
      setContext(messageContext);

      handler(message.payload);

      setContext(parentContext);
    });
  }

  send(queueName, command) {
    const context = getContext();
    const message = {
      context: context ? { traceId: context.traceId, spanId: context.spanId } : null,
      payload: command,
    };
    console.log(`MessageBus: Sending command to queue "${queueName}"`, message.payload);
    if (!this.queues.has(queueName)) {
      this.queues.set(queueName, []);
    }
    this.queues.get(queueName).push(message);
  }

  processQueue(queueName, handler) {
    if (this.queues.has(queueName)) {
      const queue = this.queues.get(queueName);
      while (queue.length > 0) {
        const message = queue.shift();
        const parentContext = getContext();
        const messageContext = message.context ? new CorrelationContext(message.context.traceId, message.context.spanId) : null;
        setContext(messageContext);
        handler(message.payload);
        setContext(parentContext);
      }
    }
  }
}

const messageBus = new MessageBus();

module.exports = {
  MessageBus,
  messageBus,
};
