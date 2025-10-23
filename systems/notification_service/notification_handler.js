const { emailService } = require('./email_service');

class NotificationHandler {
  constructor(messageBus) {
    this.messageBus = messageBus;
  }

  /**
   * Subscribes to relevant events from the message bus.
   */
  subscribe() {
    this.messageBus.subscribe('UserRegistered', this.handleUserRegistered.bind(this));
  }

  /**
   * Handles the UserRegistered event.
   * @param {object} event The UserRegistered event.
   */
  async handleUserRegistered(event) {
    console.log(`NotificationHandler: Received UserRegistered event for ${event.data.email}`);
    try {
      await emailService.sendWelcomeEmail(event.data.email);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // In a real system, we would implement a retry mechanism or a dead-letter queue.
    }
  }
}

module.exports = { NotificationHandler };
