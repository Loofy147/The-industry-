class FlawedSingleton {
  // This flawed implementation will always create a new instance,
  // simulating the effect of a race condition.
  constructor() {
    this.createdAt = new Date();
  }

  static async getInstance() {
    // Simulate a slow initialization process
    await new Promise(resolve => setTimeout(resolve, 100));
    return new FlawedSingleton();
  }
}

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
