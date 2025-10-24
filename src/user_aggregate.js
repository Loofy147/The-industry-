const {
  v4: uuidv4
} = require('uuid');

class User {
  constructor() {
    this._id = null;
    this.email = null;
    this.password = null; // In a real app, this would be a hash
    this.isActive = false;
    this.role = 'customer'; // Default role
    this.version = -1; // Used for optimistic concurrency control
  }

  // --- State Hydration ---
  // This is the core of event sourcing: the aggregate's state is built by applying events.
  apply(event) {
    if (event.type === 'UserRegistered') {
      this._id = event.aggregateId;
      this.email = event.data.email;
      this.password = event.data.password;
      this.isActive = true;
      this.role = event.data.role || 'customer'; // Set role from event
    } else if (event.type === 'UserDeactivated') {
      this.isActive = false;
    }
    this.version++;
  }

  // --- Command Handlers ---
  // These methods represent the business operations that can be performed on the aggregate.
  // They validate the command and, if successful, produce one or more events.

  registerUser(command) {
    // Command validation
    if (!command.email || !command.email.includes('@')) {
      throw new Error('Invalid email address.');
    }
    if (!command.password || command.password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    // Produce the event
    // The aggregate doesn't change its own state here. It produces an event.
    // The state change happens in the `apply` method.
    return this._createEvent('UserRegistered', {
      email: command.email,
      password: command.password,
      role: command.role,
    });
  }

  deactivateUser(command) {
    if (!this.isActive) {
      // Idempotency: If the user is already deactivated, do nothing.
      return null;
    }
    // For this simple example, the command doesn't need extra data.
    return this._createEvent('UserDeactivated', {});
  }

  // --- Private Helper ---
  _createEvent(type, data) {
    const aggregateId = this._id || uuidv4(); // Generate a new ID for the first event
    return {
      type,
      aggregateId,
      timestamp: new Date().toISOString(),
      data,
    };
  }
}

module.exports = {
  User
};