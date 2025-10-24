const { getContext, setContext, CorrelationContext } = require('./observability');
const { schemaValidator } = require('./schema_validator');
require('../schemas/user_registered'); // Ensure schemas are registered
require('../schemas/user_deactivated'); // Ensure schemas are registered

class MessageBus {
  constructor() {
    this.subscriptions = new Map();
    this.queues = new Map();
    this.deadLetterQueue = []; // For messages that fail validation
  }

  subscribe(topic, handler, schemaVersion = 1) { // Consumers can specify which version they support
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, []);
    }
    this.subscriptions.get(topic).push({ handler, schemaVersion });
  }

  publish(topic, event) {
    const context = getContext();
    const message = {
      context: context ? { traceId: context.traceId, spanId: context.spanId } : null,
      payload: event,
    };

    console.log(`MessageBus: Publishing event to topic "${topic}"`, message.payload);

    if (this.subscriptions.has(topic)) {
      this.subscriptions.get(topic).forEach(({ handler, schemaVersion }) => {
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
