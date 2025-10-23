/**
 * An in-memory implementation of a Message Bus.
 * In a real, distributed application, this would be replaced with a robust
 * message broker like RabbitMQ, Kafka, or AWS SQS/SNS.
 *
 * This bus supports two main patterns:
 * 1. Publish/Subscribe: Publishing events to any number of subscribers.
 * 2. Point-to-Point: Sending commands to a specific, named queue.
 */
class MessageBus {
  constructor() {
    this.subscriptions = new Map(); // Topic -> Array<Callback>
    this.queues = new Map(); // QueueName -> Array<Message>
  }

  /**
   * Subscribes a handler to a specific topic (e.g., an event type).
   * @param {string} topic The topic to subscribe to.
   * @param {Function} handler The callback to execute when a message is published.
   */
  subscribe(topic, handler) {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, []);
    }
    this.subscriptions.get(topic).push(handler);
  }

  /**
   * Publishes an event to all subscribers of a topic.
   * @param {string} topic The topic of the event.
   * @param {object} event The event object.
   */
  publish(topic, event) {
    console.log(`MessageBus: Publishing event to topic "${topic}"`, event);
    if (this.subscriptions.has(topic)) {
      this.subscriptions.get(topic).forEach(handler => {
        // In a real system, this would be asynchronous and might involve a network call.
        handler(event);
      });
    }
  }

  /**
   * Sends a command to a specific queue.
   * @param {string} queueName The name of the queue.
   * @param {object} command The command object.
   */
  send(queueName, command) {
    console.log(`MessageBus: Sending command to queue "${queueName}"`, command);
    if (!this.queues.has(queueName)) {
      this.queues.set(queueName, []);
    }
    this.queues.get(queueName).push(command);
  }

  /**
   * Registers a handler to process messages from a specific queue.
   * @param {string} queueName The name of the queue.
   * @param {Function} handler The callback to execute for each message.
   */
  processQueue(queueName, handler) {
    if (this.queues.has(queueName)) {
      const queue = this.queues.get(queueName);
      while (queue.length > 0) {
        const message = queue.shift();
        handler(message);
      }
    }
  }
}

const messageBus = new MessageBus();

module.exports = {
  MessageBus,
  messageBus,
};
