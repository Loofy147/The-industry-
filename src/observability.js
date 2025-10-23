const { v4: uuidv4 } = require('uuid');

class CorrelationContext {
  constructor(traceId, spanId) {
    this.traceId = traceId || uuidv4();
    this.spanId = spanId || uuidv4().substring(0, 8);
  }

  createChildContext() {
    return new CorrelationContext(this.traceId);
  }
}

let currentContext = null;

function getContext() {
  return currentContext;
}

function setContext(context) {
  currentContext = context;
}

/**
 * A higher-order function that wraps a function to provide tracing.
 * It manages the correlation context and captures metrics, but does not log directly.
 * The context-aware logger will automatically pick up the context.
 * @param {Function} fn The async function to wrap.
 * @param {string} operationName A descriptive name for the operation.
 */
function Tracer(fn, operationName) {
  return async function(...args) {
    const parentContext = getContext();
    // Establish the new context for this operation.
    const context = parentContext ? parentContext.createChildContext() : new CorrelationContext();
    setContext(context);

    // We no longer log from here. The actual function will use the logger,
    // which will automatically pick up the context we just set.

    try {
      return await fn.apply(this, args);
    } catch (error) {
      // Re-throw the error so the application can handle it. The logger
      // in the calling code will be responsible for logging it.
      throw error;
    } finally {
      // Restore the parent context.
      setContext(parentContext);
    }
  };
}

module.exports = {
  CorrelationContext,
  getContext,
  setContext,
  Tracer,
};
