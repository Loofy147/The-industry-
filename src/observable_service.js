/**
 * This module represents a refactored service that is now highly observable.
 * It uses the StructuredLogger to produce clear, context-rich, and machine-parseable logs.
 */
class ObservableService {
  constructor(logger) {
    this.logger = logger;
  }

  processUserData(userId) {
    // We create a logger with context specific to this request.
    // In a real web framework, this would be done by a middleware.
    const requestLogger = this.logger.withContext({ userId });

    requestLogger.info('User data processing started');

    // Simulate some business logic
    if (userId < 0) {
      requestLogger.error('Invalid user ID provided', { error_code: 'INVALID_INPUT' });
      return { success: false, message: 'Invalid user ID' };
    }

    // Simulate a database call
    requestLogger.info('Fetching data from database');
    const data = { id: userId, name: 'John Doe' };
    requestLogger.info('Data fetched successfully', { db_latency_ms: 55 });

    // Simulate another action
    requestLogger.info('Enriching data');
    const enrichedData = { ...data, enriched: true };
    requestLogger.info('Enrichment complete');

    requestLogger.info('User data processing finished');
    return { success: true, data: enrichedData };
  }
}

module.exports = { ObservableService };
