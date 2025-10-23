/**
 * This module represents a common implementation of a stateful web server.
 * It violates the principle of statelessness by storing critical session data
 * in its own local memory (`sessions` object).
 *
 * This implementation is simple but fundamentally flawed for a distributed,
 * scalable environment.
 */
class StatefulWebServer {
  constructor() {
    this.sessions = {}; // State is stored in local memory
  }

  // Simulates handling a request
  handleRequest(request) {
    const { sessionId, action, data } = request;

    if (!sessionId) {
      // Create a new session if one doesn't exist
      const newSessionId = `session_${Date.now()}`;
      this.sessions[newSessionId] = { cart: [] };
      return { sessionId: newSessionId, data: this.sessions[newSessionId] };
    }

    const session = this.sessions[sessionId];
    if (!session) {
      // This is what happens when a request for an existing session hits the wrong server
      return { error: 'Session not found', status: 404 };
    }

    if (action === 'ADD_TO_CART') {
      session.cart.push(data.item);
    }

    return { sessionId, data: session };
  }
}

module.exports = { StatefulWebServer };
