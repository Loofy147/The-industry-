/**
 * The StructuredLogger is now context-aware. It automatically includes
 * the current correlation context in every log message.
 */
class StructuredLogger {
  constructor(getContext, baseContext = {}, outputStream = process.stdout) {
    this.getContext = getContext;
    this.baseContext = baseContext;
    this.outputStream = outputStream;
  }

  child(extraContext) {
    const newContext = { ...this.baseContext, ...extraContext };
    return new StructuredLogger(this.getContext, newContext, this.outputStream);
  }

  _log(level, message, data = {}) {
    const correlationContext = this.getContext(); // Dynamically get the current context.

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      ...this.baseContext,
      ...(correlationContext && {
        traceId: correlationContext.traceId,
        spanId: correlationContext.spanId,
      }),
      message,
      ...data,
    };
    this.outputStream.write(JSON.stringify(logEntry) + '\n');
  }

  info(message, data) {
    this._log('info', message, data);
  }

  warn(message, data) {
    this._log('warn', message, data);
  }

  error(message, data) {
    this._log('error', message, data);
  }
}

// The baseLogger now needs the getContext function to be injected.
// We will do this in a central composition root.
const { getContext } = require('./observability');
const baseLogger = new StructuredLogger(getContext);


module.exports = { StructuredLogger, baseLogger };
