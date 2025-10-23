const { sagaOrchestrator } = require('./saga_orchestrator');
const { emailService } = require('../systems/notification_service/email_service');

const USER_REGISTRATION_SAGA = 'USER_REGISTRATION_SAGA';

/**
 * The saga definition is now a function that accepts its dependencies.
 * This makes it easier to test by injecting mocks.
 * @param {UserLogic} userLogic The user logic command handler.
 */
function defineUserRegistrationSaga(userLogic) {
  sagaOrchestrator.define(USER_REGISTRATION_SAGA, [
    {
      name: 'createUser',
      action: async (context) => {
        console.log(`Saga: Dispatching registerUser command for ${context.username}`);
        const userId = await userLogic.registerUser(context.username, context.password);
        return { ...context, userId };
      },
      compensation: async (context) => {
        if (context.userId) {
          console.log(`Saga: Dispatching deactivateUser command for userId ${context.userId}`);
          await userLogic.deactivateUser(context.userId);
        }
      },
    },
    {
      name: 'sendWelcomeEmail',
      action: async (context) => {
        console.log(`Saga: Sending welcome email to ${context.username}`);
        await emailService.sendWelcomeEmail(context.username);
        return context;
      },
      compensation: (context) => {
        console.log(`Saga: Compensating email for ${context.username} (no action needed).`);
        return Promise.resolve();
      }
    },
  ]);
}

module.exports = {
  USER_REGISTRATION_SAGA,
  defineUserRegistrationSaga,
};
