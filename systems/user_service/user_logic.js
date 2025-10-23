const {
  User
} = require('../../src/user_aggregate');

/**
 * The UserLogic command handler is now fully decoupled from persistence.
 * Its only dependencies are the aggregate repository (to load state) and the
 * message bus (to publish events).
 */
class UserLogic {
  constructor(userRepository, messageBus) {
    this.userRepository = userRepository;
    this.messageBus = messageBus;
  }

  /**
   * Handles the RegisterUser command.
   * @param {string} email
   * @param {string} password
   * @returns {string} The ID of the newly created user.
   */
  async registerUser(email, password) {
    // 1. Create a new User aggregate instance.
    const user = new User();

    // 2. Execute business logic to produce an event.
    const event = user.registerUser({
      email,
      password
    });

    // 3. Publish the event. The EventStore is listening and will handle persistence.
    this.messageBus.publish(event.type, event);

    // 4. Return the aggregate ID.
    return event.aggregateId;
  }

  /**
   * Handles the DeactivateUser command.
   * @param {string} userId
   */
  async deactivateUser(userId) {
    // 1. Load the aggregate from history.
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    // 2. Execute business logic to produce an event.
    const event = user.deactivateUser({});
    if (!event) {
      return; // No event produced.
    }

    // 3. Publish the event.
    this.messageBus.publish(event.type, event);
  }
}

module.exports = {
  UserLogic
};