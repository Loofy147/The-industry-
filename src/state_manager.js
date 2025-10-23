/**
 * This module represents the core of the shared solution: an externalized state manager.
 * It provides a simple async API for managing session state.
 *
 * In a real-world application, this module would wrap a client for a distributed
 * store like Redis or Memcached. Here, we simulate it with a simple in-memory object
 * to keep the example self-contained and testable.
 */

// This shared object simulates a single, centralized state store (like a Redis instance).
const simulatedExternalStore = {};

class StateManager {
  constructor(store) {
    this.store = store;
  }

  async getSession(sessionId) {
    // Simulate async network call
    await new Promise(resolve => setTimeout(resolve, 10));
    return this.store[sessionId];
  }

  async createSession(sessionId, initialData) {
    // Simulate async network call
    await new Promise(resolve => setTimeout(resolve, 10));
    this.store[sessionId] = initialData;
    return this.store[sessionId];
  }

  async updateSession(sessionId, newData) {
    // Simulate async network call
    await new Promise(resolve => setTimeout(resolve, 10));
    this.store[sessionId] = newData;
    return this.store[sessionId];
  }
}

// Export a pre-configured instance for the application to use.
const stateManager = new StateManager(simulatedExternalStore);

// Export a helper to clear the store for tests.
function clearExternalStore() {
  for (const key in simulatedExternalStore) {
    delete simulatedExternalStore[key];
  }
}

module.exports = { StateManager, stateManager, clearExternalStore };
