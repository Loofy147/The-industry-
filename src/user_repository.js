/**
 * This module adheres to the Single Responsibility Principle.
 * Its only responsibility is data persistence for user records.
 * It has only one reason to change: if the database schema or technology changes.
 */

class UserRepository {
  constructor(dbClient) {
    this.db = dbClient;
  }

  async createUser(email, password) {
    // The logic for how to format and save a user lives here.
    const user = { email, password }; // In a real app, you'd hash the password
    return this.db.save(user);
  }
}

// Stand-in for a real database client for demonstration.
const fakeDbClient = {
  save: async (user) => {
    console.log(`Saving user ${user.email} to the database.`);
    await new Promise(resolve => setTimeout(resolve, 100));
    return { id: 1, ...user };
  }
};

const userRepository = new UserRepository(fakeDbClient);

module.exports = { UserRepository, userRepository };
