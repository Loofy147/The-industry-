const {
  User
} = require('../../src/user_aggregate');
const {
  Tracer
} = require('../../src/observability');
const {
  baseLogger
} = require('../../src/structured_logger');


class UserLogic {
  constructor(userRepository, messageBus) {
    this.userRepository = userRepository;
    this.messageBus = messageBus;

    // --- Instrumentation ---
    // Wrap the public methods with the Tracer to automatically create spans.
    this.registerUser = Tracer(this._registerUser.bind(this), 'UserLogic.registerUser');
    this.deactivateUser = Tracer(this._deactivateUser.bind(this), 'UserLogic.deactivateUser');
  }

  async _registerUser(email, password) {
    const logger = baseLogger.child({
      operationName: 'UserLogic.registerUser'
    });
    logger.info('Registering new user.');
    const user = new User();
    const event = user.registerUser({
      email,
      password
    });
    this.messageBus.publish(event.type, event);
    logger.info('User registration event published.');
    return event.aggregateId;
  }

  async _deactivateUser(userId) {
    const logger = baseLogger.child({
      operationName: 'UserLogic.deactivateUser'
    });
    logger.info('Deactivating user.');
    const user = await this.userRepository.findById(userId);
    if (!user) {
      logger.error('User not found.');
      throw new Error('User not found.');
    }
    const event = user.deactivateUser({});
    if (!event) {
      logger.warn('User already deactivated.');
      return;
    }
    this.messageBus.publish(event.type, event);
    logger.info('User deactivation event published.');
  }
}

module.exports = {
  UserLogic
};