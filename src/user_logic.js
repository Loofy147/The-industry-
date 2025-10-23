const {
  User
} = require('./user_aggregate');
/**
 * In a CQRS system, this module would be considered a "Command Handler".
 * Its responsibility is to receive a command, find the correct aggregate,
 * execute the business logic on the aggregate, and save the resulting events.
 */
class UserLogic {
  constructor(userRepository) {
    this.userRepository = userRepository;
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

    // 2. Execute the business logic (command) on the aggregate.
    // This validates the input and produces an event if successful.
    const event = user.registerUser({
      email,
      password
    });

    // 3. Save the new event to the event store via the repository.
    await this.userRepository.save(event);

    // 4. Return the aggregate ID to the caller.
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

    // 2. Execute the business logic on the aggregate.
    const event = user.deactivateUser({});
    if (!event) {
      // The command resulted in no event (e.g., user was already deactivated).
      return;
    }

    // 3. Save the new event.
    await this.userRepository.save(event);
  }
}

module.exports = {
  UserLogic
};