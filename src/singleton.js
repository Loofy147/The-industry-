/**
 * A flawed singleton implementation that is not thread-safe.
 */
class FlawedSingleton {
  // This flawed implementation will always create a new instance,
  // simulating the effect of a race condition.
  constructor() {
    this.createdAt = new Date();
  }

  /**
   * Gets the singleton instance.
   * @returns {Promise<FlawedSingleton>} A promise that resolves with the singleton instance.
   */
  static async getInstance() {
    // Simulate a slow initialization process
    await new Promise(resolve => setTimeout(resolve, 100));
    return new FlawedSingleton();
  }
}

/**
 * A secure singleton implementation that is thread-safe.
 */
class SecureSingleton {
  static promise = null;
  static instance = null;

  constructor() {
    this.createdAt = new Date();
  }

  static getInstance() {
    if (!this.promise) {
      this.promise = new Promise(async (resolve) => {
        // Simulate a slow initialization process
        await new Promise(resolve => setTimeout(resolve, 100));
        this.instance = new SecureSingleton();
        resolve(this.instance);
      });
    }
    return this.promise;
  }
}

module.exports = { FlawedSingleton, SecureSingleton };
