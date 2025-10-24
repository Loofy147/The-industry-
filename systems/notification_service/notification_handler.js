const { emailService } = require('./email_service');
const { Tracer } = require('../../src/observability');
const { baseLogger } = require('../../src/structured_logger');

class NotificationHandler {
  constructor(messageBus) {
    this.messageBus = messageBus;
  }

  /**
   * Subscribes to relevant events from the message bus.
   */
  subscribe() {
    // The handler is now wrapped with the Tracer.
    const tracedHandler = Tracer(this._handleUserRegistered.bind(this), 'NotificationHandler.handleUserRegistered');
    this.messageBus.subscribe('UserRegistered', tracedHandler);
  }

  /**
   * Handles the UserRegistered event.
   * @param {object} event The UserRegistered event.
   */
  async _handleUserRegistered(event) {
    const logger = baseLogger.child({ operationName: 'NotificationHandler.handleUserRegistered' });
    logger.info(`Received UserRegistered event for ${event.data.email}`);
    try {
      await emailService.sendWelcomeEmail(event.data.email);
      logger.info('Welcome email sent successfully.');
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to send welcome email.');
      throw error;
    }
  }
}

module.exports = { NotificationHandler };
