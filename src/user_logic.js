/**
 * This module adheres to the Single Responsibility Principle.
 * Its only responsibility is to orchestrate the user registration process.
 * It contains the core application/business logic.
 *
 * It has only one reason to change: if the business rules for registration change.
 * It does not know how to save users or send emails, only that it can be done.
 */

class UserLogic {
  constructor(userRepository, emailService) {
    this.userRepository = userRepository;
    this.emailService = emailService;
  }

  async registerUser(email, password) {
    // Responsibility: Business Logic / Validation
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email address.');
    }
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    // Orchestration: It coordinates the other services.
    const newUser = await this.userRepository.createUser(email, password);
    await this.emailService.sendWelcomeEmail(email);

    return newUser;
  }
}

module.exports = { UserLogic };
