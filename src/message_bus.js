const { getContext, setContext, CorrelationContext } = require('./observability');

/**
 * An in-memory implementation of a Message Bus that propagates a correlation context.
 */
class MessageBus {
  constructor() {
    this.subscriptions = new Map();
    this.queues = new Map();
  }

  subscribe(topic, handler) {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, []);
    }
    this.subscriptions.get(topic).push(handler);
  }

  /**
   * Publishes an event, attaching the current correlation context to the message.
   */
  publish(topic, event) {
    const context = getContext();
    const message = {
      context: context ? { traceId: context.traceId, spanId: context.spanId } : null,
      payload: event,
    };

    console.log(`MessageBus: Publishing event to topic "${topic}"`, message.payload);

    if (this.subscriptions.has(topic)) {
      this.subscriptions.get(topic).forEach(handler => {
        // Restore the context before invoking the handler.
        const parentContext = getContext();
        const messageContext = message.context ? new CorrelationContext(message.context.traceId, message.context.spanId) : null;
        setContext(messageContext);

        handler(message.payload); // Pass the original event payload to the handler

        // Restore the previous context.
        setContext(parentContext);
      });
    }
  }

  /**
   * Sends a command, attaching the current correlation context.
   */
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

        // Restore the context.
        const parentContext = getContext();
        const messageContext = message.context ? new CorrelationContext(message.context.traceId, message.context.spanId) : null;
        setContext(messageContext);

        handler(message.payload);

        // Restore the previous context.
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
