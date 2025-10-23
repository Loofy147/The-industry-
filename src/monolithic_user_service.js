/**
 * This module represents a common violation of the Single Responsibility Principle.
 * It has three distinct responsibilities, and thus, three reasons to change:
 * 1. User validation logic (e.g., checking for a valid email).
 * 2. Database persistence logic (e.g., how to save a user).
 * 3. Email notification logic (e.g., how to send a welcome email).
 *
 * This tight coupling makes the module difficult to maintain, test, and reuse.
 */

// These are stand-ins for real database and email clients.
const fakeDbClient = {
  save: async (user) => {
    console.log(`Saving user ${user.email} to the database.`);
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    return { id: 1, ...user };
  }
};

const fakeEmailClient = {
  send: async (to, subject, body) => {
    console.log(`Sending email to ${to}: ${subject}`);
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  }
};

class MonolithicUserService {
  constructor(db, emailer) {
    // The dependencies are still injected, but the class itself does too much.
    this.db = db;
    this.emailer = emailer;
  }

  async registerUser(email, password) {
    // Responsibility 1: Business Logic / Validation
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email address.');
    }
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    // Responsibility 2: Data Persistence
    const user = { email, password }; // In a real app, you'd hash the password
    const newUser = await this.db.save(user);

    // Responsibility 3: Notifications
    await this.emailer.send(
      email,
      'Welcome!',
      'Thanks for signing up.'
    );

    return newUser;
  }
}

// Export a pre-configured instance for demonstration
const monolithicUserService = new MonolithicUserService(fakeDbClient, fakeEmailClient);

module.exports = { MonolithicUserService, monolithicUserService };
