const {
  v4: uuidv4
} = require('uuid');

/**
 * The User aggregate, representing a user in the system.
 */
class User {
  /**
   * Creates a new User instance.
   */
  constructor() {
    this._id = null;
    this.email = null;
    this.password = null; // In a real app, this would be a hash
    this.isActive = false;
    this.role = 'customer'; // Default role
    this.version = -1; // Used for optimistic concurrency control
  }

  /**
   * Applies an event to the aggregate, updating its state.
   * @param {object} event The event to apply.
   */
  apply(event) {
    if (event.type === 'UserRegistered') {
      this._id = event.aggregateId;
      this.email = event.data.email;
      this.password = event.data.password;
      this.isActive = true;
      this.role = event.data.role || 'customer'; // Set role from event
    } else if (event.type === 'UserDeactivated') {
      this.isActive = false;
    } else if (event.type === 'UserUpdated') {
      // For testing snapshots, we'll just increment the version
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
      version: this.version + 1,
      data,
    };
  }

  /**
   * Returns the current state of the aggregate for snapshotting.
   * @returns {object} The aggregate's state.
   */
  getState() {
    return {
      _id: this._id,
      email: this.email,
      password: this.password,
      isActive: this.isActive,
      role: this.role,
      version: this.version,
    };
  }

  /**
   * Loads the aggregate's state from a snapshot.
   * @param {object} snapshot The snapshot data.
   */
  loadFromSnapshot(snapshot) {
    this._id = snapshot.state._id;
    this.email = snapshot.state.email;
    this.password = snapshot.state.password;
    this.isActive = snapshot.state.isActive;
    this.role = snapshot.state.role;
    this.version = snapshot.version;
  }
}

module.exports = {
  User
};