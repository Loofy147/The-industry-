const {
  User
} = require('../../src/user_aggregate');
const {
  Tracer
} = require('../../src/observability');
const {
  baseLogger
} = require('../../src/structured_logger');
const api = require('@opentelemetry/api');
const {
  RulesEngine
} = require('../../src/rules_engine');
const {
  deactivationRules
} = require('./deactivation_rules');

class UserLogic {
  constructor(userRepository, messageBus) {
    this.userRepository = userRepository;
    this.messageBus = messageBus;
    this.deactivationRulesEngine = new RulesEngine(deactivationRules);

    // --- Instrumentation ---
    this.registerUser = Tracer(this._registerUser.bind(this), 'UserLogic.registerUser');
    this.deactivateUser = Tracer(this._deactivateUser.bind(this), 'UserLogic.deactivateUser');
  }

  async _registerUser(email, password, role = 'customer') { // Add role parameter
    const tracer = api.trace.getTracer('user-service');
    return tracer.startActiveSpan('UserLogic._registerUser', async (span) => {
      const logger = baseLogger.child({
        operationName: 'UserLogic.registerUser'
      });
      logger.info('Registering new user.');
      const user = new User();
      const event = user.registerUser({
        email,
        password,
        role
      }); // Pass role to aggregate
      this.messageBus.publish(event.type, event);
      logger.info('User registration event published.');
      span.end();
      return event.aggregateId;
    });
  }

  async _deactivateUser(userId) {
    const tracer = api.trace.getTracer('user-service');
    return tracer.startActiveSpan('UserLogic._deactivateUser', async (span) => {
      const logger = baseLogger.child({
        operationName: 'UserLogic.deactivateUser'
      });
      logger.info('Deactivating user.');
      const user = await this.userRepository.findById(userId);
      if (!user) {
        logger.error('User not found.');
        throw new Error('User not found.');
      }

      // --- Business Rules Evaluation ---
      const facts = {
        user: {
          id: user._id,
          email: user.email,
          isActive: user.isActive,
          role: user.role
        }
      };
      const ruleResult = this.deactivationRulesEngine.evaluate(facts);
      if (ruleResult.outcome === 'deny') {
        logger.warn({
          reason: ruleResult.reason
        }, 'Deactivation denied by business rule.');
        throw new Error(ruleResult.reason);
      }
      // --- End Evaluation ---

      const event = user.deactivateUser({});
      if (!event) {
        logger.warn('User already deactivated.');
        return null;
      }
      this.messageBus.publish(event.type, event);
      logger.info('User deactivation event published.');
      span.end();
    });
  }
}

module.exports = {
  UserLogic
};