/**
 * This module provides the powerful, shared solution: a StructuredLogger.
 * It outputs logs as JSON and manages the propagation of context.
 */
class StructuredLogger {
  constructor(context = {}, outputStream = process.stdout) {
    this.context = context;
    this.outputStream = outputStream; // Allows for easy testing by redirecting output
  }

  // Creates a "child" logger with additional, persistent context.
  withContext(extraContext) {
    const newContext = { ...this.context, ...extraContext };
    return new StructuredLogger(newContext, this.outputStream);
  }

  // The core logging function.
  _log(level, message, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      ...this.context, // All persistent context is automatically included
      message,
      ...data,
    };
    // In a real app, you'd add more logic for handling different environments (e.g., pretty-printing in dev)
    this.outputStream.write(JSON.stringify(logEntry) + '\n');
  }

  info(message, data) {
    this._log('info', message, data);
  }

  warn(message, data) {
    this._log('warn', message, data);
  }

  error(message, data) {
    // In a real app, the `data` for an error would likely include the stack trace.
    this._log('error', message, data);
  }
}

// Export a base instance of the logger.
const baseLogger = new StructuredLogger();

module.exports = { StructuredLogger, baseLogger };
