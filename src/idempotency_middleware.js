/**
 * This module simulates an idempotency middleware layer for distributed systems.
 * In a real-world scenario, the `idempotencyStore` would be a distributed cache like Redis.
 */

// An in-memory cache to simulate a distributed store for idempotency keys.
const idempotencyStore = new Map();
const inFlightRequests = new Map();

/**
 * A higher-order function that wraps a business logic function to make it idempotent.
 * It uses an in-memory store to track idempotency keys and cache responses.
 *
 * @param {Function} businessLogic The async function to make idempotent.
 *   This function is expected to take a single `request` object as an argument.
 * @returns {Function} An async function that wraps the original business logic.
 */
function makeIdempotent(businessLogic) {
  return async function(request) {
    const idempotencyKey = request.headers['idempotency-key'];

    // If there's no key, execute the logic directly.
    if (!idempotencyKey) {
      return businessLogic(request);
    }

    // Check if the response is already cached.
    if (idempotencyStore.has(idempotencyKey)) {
      return idempotencyStore.get(idempotencyKey);
    }

    // Check for an in-flight request with the same key to handle concurrent requests.
    if (inFlightRequests.has(idempotencyKey)) {
      return inFlightRequests.get(idempotencyKey);
    }

    // If this is a new key, execute the business logic and cache the result.
    const promise = businessLogic(request);
    inFlightRequests.set(idempotencyKey, promise);

    try {
      const response = await promise;
      idempotencyStore.set(idempotencyKey, response);
      return response;
    } catch (error) {
      // Do not cache errors, so the request can be retried.
      throw error;
    } finally {
      // Clean up the in-flight request map.
      inFlightRequests.delete(idempotencyKey);
    }
  };
}

// A helper function to clear the store for testing purposes.
function clearIdempotencyStore() {
  idempotencyStore.clear();
  inFlightRequests.clear();
}

module.exports = { makeIdempotent, clearIdempotencyStore };