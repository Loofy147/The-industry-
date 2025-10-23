const { makeIdempotent, clearIdempotencyStore } = require('../src/idempotency_middleware');

describe('Idempotency Middleware', () => {
  let callCount;
  let businessLogic;

  beforeEach(() => {
    // Reset the store and call count before each test
    clearIdempotencyStore();
    callCount = 0;
    businessLogic = async (request) => {
      callCount++;
      // Simulate some async work
      await new Promise(resolve => setTimeout(resolve, 50));
      return { status: 200, body: `processed transaction ${request.body.transactionId}` };
    };
  });

  // Test for Gap 1: Critical Data Corruption
  test('should execute the business logic only once for multiple identical requests', async () => {
    const idempotentLogic = makeIdempotent(businessLogic);
    const request = {
      headers: { 'idempotency-key': 'key-123' },
      body: { transactionId: 'txn-abc' },
    };

    const response1 = await idempotentLogic(request);
    const response2 = await idempotentLogic(request);
    const response3 = await idempotentLogic(request);

    // The business logic should have only been called once
    expect(callCount).toBe(1);

    // All responses should be identical
    expect(response2).toBe(response1);
    expect(response3).toBe(response1);
    expect(response1.body).toBe('processed transaction txn-abc');
  });

  // Test for Gap 2: Systemic Unreliability (Safe Retries)
  test('should return the cached response for retried requests', async () => {
    const idempotentLogic = makeIdempotent(businessLogic);
    const request = {
      headers: { 'idempotency-key': 'key-456' },
      body: { transactionId: 'txn-def' },
    };

    // First request succeeds
    const firstResponse = await idempotentLogic(request);
    expect(firstResponse.status).toBe(200);
    expect(callCount).toBe(1);

    // A second "retry" request is made
    const retryResponse = await idempotentLogic(request);
    expect(retryResponse).toBe(firstResponse);
    expect(callCount).toBe(1); // Should not have incremented
  });

  // Test for Gap 3: Poor User Experiences (Concurrent Requests)
  test('should handle concurrent requests with the same key safely', async () => {
    const idempotentLogic = makeIdempotent(businessLogic);
    const request = {
      headers: { 'idempotency-key': 'key-789' },
      body: { transactionId: 'txn-ghi' },
    };

    // Fire off multiple requests concurrently
    const promises = [
      idempotentLogic(request),
      idempotentLogic(request),
      idempotentLogic(request),
    ];

    const responses = await Promise.all(promises);

    // The business logic should still have only been called once
    expect(callCount).toBe(1);

    // All responses should be the same instance, from the first completed call
    const firstResponse = responses[0];
    expect(responses[1]).toBe(firstResponse);
    expect(responses[2]).toBe(firstResponse);
  });

  test('should execute logic normally if no idempotency key is provided', async () => {
    const idempotentLogic = makeIdempotent(businessLogic);
    const request = {
      headers: {}, // No idempotency key
      body: { transactionId: 'txn-jkl' },
    };

    await idempotentLogic(request);
    await idempotentLogic(request);

    expect(callCount).toBe(2);
  });

  test('should not cache errors, allowing retries', async () => {
    let shouldFail = true;
    const fallibleLogic = async (request) => {
      callCount++;
      await new Promise(resolve => setTimeout(resolve, 20));
      if (shouldFail) {
        shouldFail = false;
        throw new Error('transient failure');
      }
      return { status: 200, body: `processed ${request.body.transactionId}` };
    };

    const idempotentLogic = makeIdempotent(fallibleLogic);
    const request = {
      headers: { 'idempotency-key': 'key-err' },
      body: { transactionId: 'txn-err' },
    };

    // The first request should fail
    await expect(idempotentLogic(request)).rejects.toThrow('transient failure');
    expect(callCount).toBe(1);

    // The second request should succeed
    const response = await idempotentLogic(request);
    expect(response.status).toBe(200);
    expect(callCount).toBe(2);
  });
});