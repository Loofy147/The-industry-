const { sagaOrchestrator } = require('./saga_orchestrator');
// The saga now depends on the command handler (UserLogic) and the email service.
// It no longer knows about the repository.
const { UserLogic } = require('./user_logic');
const { userRepository } = require('./user_repository'); // Needed to instantiate UserLogic
const { emailService } = require('./email_service');

const USER_REGISTRATION_SAGA = 'USER_REGISTRATION_SAGA';

// Instantiate a UserLogic for the saga to use.
const userLogic = new UserLogic(userRepository);


sagaOrchestrator.define(USER_REGISTRATION_SAGA, [
  {
    name: 'createUser',
    // The action now dispatches a command.
    action: async (context) => {
      console.log(`Saga: Dispatching registerUser command for ${context.username}`);
      const userId = await userLogic.registerUser(context.username, context.password);
      return { ...context, userId };
    },
    // The compensation now dispatches a compensating command.
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

module.exports = {
  USER_REGISTRATION_SAGA,
};
