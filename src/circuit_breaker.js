const { metricsService } = require('./metrics_service');

const State = {
  CLOSED: 0,
  OPEN: 1,
  HALF_OPEN: 2,
};

const StateLabel = {
  [State.CLOSED]: 'CLOSED',
  [State.OPEN]: 'OPEN',
  [State.HALF_OPEN]: 'HALF_OPEN',
};

// Register circuit breaker metrics
metricsService.registerGauge('circuit_breaker_state', 'The current state of a circuit breaker (0=CLOSED, 1=OPEN, 2=HALF_OPEN).');

/**
 * A generic Circuit Breaker implementation to prevent cascading failures.
 */
class CircuitBreaker {
  /**
   * Creates a new CircuitBreaker instance.
   * @param {string} name - The name of the circuit breaker.
   * @param {object} [options={}] Configuration options.
   * @param {number} [options.failureThreshold=3] The number of failures required to open the circuit.
   * @param {number} [options.successThreshold=1] The number of consecutive successes in HALF_OPEN state to close the circuit.
   * @param {number} [options.timeout=5000] The duration in milliseconds the circuit stays OPEN before transitioning to HALF_OPEN.
   */
  constructor(name, options = {}) {
    if (!name) {
      throw new Error('A circuit breaker must have a name.');
    }
    this.name = name;
    this.failureThreshold = options.failureThreshold || 3;
    this.successThreshold = options.successThreshold || 1;
    this.timeout = options.timeout || 5000;

    this.state = State.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;

    this._updateMetric();
  }

  /**
   * Executes an asynchronous function protected by the circuit breaker.
   * @param {Function} asyncFunction The asynchronous function to execute.
   * @returns {Promise<*>} The result of the asyncFunction.
   */
  _updateMetric() {
    metricsService.setGauge('circuit_breaker_state', { name: this.name }, this.state);
  }

  async execute(asyncFunction) {
    if (this.state === State.OPEN) {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = State.HALF_OPEN;
        this._updateMetric();
        this.successCount = 0; // Reset for the trial run
        console.log(`CircuitBreaker '${this.name}': State changed to HALF_OPEN.`);
      } else {
        throw new Error(`CircuitBreaker '${this.name}' is OPEN. Operation rejected.`);
      }
    }

    try {
      const result = await asyncFunction();
      return this._onSuccess(result);
    } catch (error) {
      this._onFailure();
      throw error;
    }
  }

  /**
   * Handles a successful execution.
   * @private
   */
  _onSuccess(result) {
    if (this.state === State.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this._reset();
      }
    }
    // If the state is CLOSED, a success simply resets any previous failure count.
    this.failureCount = 0;
    return result;
  }

  /**
   * Handles a failed execution.
   * @private
   */
  _onFailure() {
    this.failureCount++;
    // In CLOSED state, trip the circuit if threshold is met.
    // In HALF_OPEN state, a single failure is enough to trip it again.
    if (this.state === State.HALF_OPEN || this.failureCount >= this.failureThreshold) {
      this._trip();
    }
  }

  /**
   * Opens the circuit.
   * @private
   */
  _trip() {
    this.state = State.OPEN;
    this._updateMetric();
    this.lastFailureTime = Date.now();
    // Reset failure count for when the circuit eventually closes again.
    this.failureCount = 0;
    console.warn(`CircuitBreaker '${this.name}': State changed to OPEN.`);
  }

  /**
   * Resets the circuit to the CLOSED state.
   * @private
   */
  _reset() {
    this.state = State.CLOSED;
    this._updateMetric();
    this.failureCount = 0;
    this.successCount = 0;
    console.info(`CircuitBreaker '${this.name}': State changed to CLOSED.`);
  }
}

module.exports = { CircuitBreaker, State, StateLabel };
