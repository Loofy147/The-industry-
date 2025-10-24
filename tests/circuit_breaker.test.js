const { CircuitBreaker, State } = require('../src/circuit_breaker');

describe('CircuitBreaker', () => {
  let circuitBreaker;
  let mockAsyncFunction;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 2,
      successThreshold: 1,
      timeout: 200, // Use a short timeout for testing
    });
    mockAsyncFunction = jest.fn();
  });

  it('should remain CLOSED when the operation is successful', async () => {
    mockAsyncFunction.mockResolvedValue('success');
    const result = await circuitBreaker.execute(mockAsyncFunction);
    expect(result).toBe('success');
    expect(circuitBreaker.state).toBe(State.CLOSED);
  });

  it('should trip to OPEN state after reaching the failure threshold', async () => {
    mockAsyncFunction.mockRejectedValue(new Error('service failure'));

    // First failure
    await expect(circuitBreaker.execute(mockAsyncFunction)).rejects.toThrow('service failure');
    expect(circuitBreaker.state).toBe(State.CLOSED);

    // Second failure - trips the circuit
    await expect(circuitBreaker.execute(mockAsyncFunction)).rejects.toThrow('service failure');
    expect(circuitBreaker.state).toBe(State.OPEN);
  });

  it('should reject operations immediately when in OPEN state', async () => {
    // Trip the circuit first
    mockAsyncFunction.mockRejectedValue(new Error('service failure'));
    await expect(circuitBreaker.execute(mockAsyncFunction)).rejects.toThrow('service failure');
    await expect(circuitBreaker.execute(mockAsyncFunction)).rejects.toThrow('service failure');

    // Attempt another call
    await expect(circuitBreaker.execute(mockAsyncFunction)).rejects.toThrow('CircuitBreaker is OPEN');
  });

  it('should transition back to CLOSED from HALF_OPEN after a success', async () => {
    // Trip the circuit and wait for it to become HALF_OPEN
    mockAsyncFunction.mockRejectedValue(new Error('service failure'));
    await expect(circuitBreaker.execute(mockAsyncFunction)).rejects.toThrow('service failure');
    await expect(circuitBreaker.execute(mockAsyncFunction)).rejects.toThrow('service failure');
    await new Promise(resolve => setTimeout(resolve, 250));

    // Succeed in HALF_OPEN state
    mockAsyncFunction.mockResolvedValue('success');
    await circuitBreaker.execute(mockAsyncFunction);
    expect(circuitBreaker.state).toBe(State.CLOSED);
  });

  it('should transition back to OPEN from HALF_OPEN after a failure', async () => {
    // Trip the circuit and wait for it to become HALF_OPEN
    mockAsyncFunction.mockRejectedValue(new Error('initial failure'));
    await expect(circuitBreaker.execute(mockAsyncFunction)).rejects.toThrow('initial failure');
    await expect(circuitBreaker.execute(mockAsyncFunction)).rejects.toThrow('initial failure');
    await new Promise(resolve => setTimeout(resolve, 250));

    // Fail in HALF_OPEN state
    mockAsyncFunction.mockRejectedValue(new Error('half-open failure'));
    await expect(circuitBreaker.execute(mockAsyncFunction)).rejects.toThrow('half-open failure');
    expect(circuitBreaker.state).toBe(State.OPEN);
  });
});
