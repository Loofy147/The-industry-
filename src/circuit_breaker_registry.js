/**
 * A central registry for all CircuitBreaker instances in the application.
 * This makes them discoverable for the Control API.
 */
class CircuitBreakerRegistry {
  constructor() {
    this.breakers = new Map();
  }

  /**
   * Registers a new CircuitBreaker instance.
   * @param {string} name A unique name for the circuit breaker (e.g., 'EmailService').
   * @param {CircuitBreaker} breaker The CircuitBreaker instance.
   */
  register(name, breaker) {
    if (this.breakers.has(name)) {
      console.warn(`CircuitBreakerRegistry: A breaker with the name "${name}" is already registered. Overwriting.`);
    }
    this.breakers.set(name, breaker);
  }

  /**
   * Retrieves the status of all registered circuit breakers.
   * @returns {object} An object containing the status of all circuit breakers.
   */
  getAllStatus() {
    const allStatus = {};
    for (const [name, breaker] of this.breakers.entries()) {
      allStatus[name] = {
        state: breaker.state,
        failureCount: breaker.failureCount,
        successCount: breaker.successCount,
        lastFailureTime: breaker.lastFailureTime,
      };
    }
    return allStatus;
  }
}

// Export a singleton instance for the application to use.
const circuitBreakerRegistry = new CircuitBreakerRegistry();

module.exports = { CircuitBreakerRegistry, circuitBreakerRegistry };
