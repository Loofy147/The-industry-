/**
 * This module represents the refactored, correct implementation.
 * This web server is completely stateless. It holds no session data in its
 * own memory. All state is managed by the external state manager.
 *
 * This implementation is scalable, resilient, and correct for a distributed environment.
 */
class StatelessWebServer {
  constructor(stateManager) {
    this.stateManager = stateManager;
  }

  // Simulates handling a request
  async handleRequest(request) {
    let { sessionId, action, data } = request;

    if (!sessionId) {
      // Create a new session if one doesn't exist
      const newSessionId = `session_${Date.now()}`;
      const newSession = await this.stateManager.createSession(newSessionId, { cart: [] });
      return { sessionId: newSessionId, data: newSession };
    }

    const session = await this.stateManager.getSession(sessionId);
    if (!session) {
      return { error: 'Session not found', status: 404 };
    }

    if (action === 'ADD_TO_CART') {
      const newCart = [...session.cart, data.item];
      const updatedSession = { ...session, cart: newCart };
      await this.stateManager.updateSession(sessionId, updatedSession);
      return { sessionId, data: updatedSession };
    }

    // For a simple GET request, just return the current session data.
    return { sessionId, data: session };
  }
}

module.exports = { StatelessWebServer };
