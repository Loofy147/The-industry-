const { InadequateLoggingService } = require('../src/inadequate_logging_service');
const { ObservableService } = require('../src/observable_service');
const { StructuredLogger } = require('../src/structured_logger');

// A simple in-memory stream to capture log output for testing.
class MockOutputStream {
  constructor() {
    this.logs = [];
  }
  write(log) {
    this.logs.push(log);
  }
  getLogs() {
    return this.logs;
  }
  getParsedLogs() {
    return this.logs.map(log => JSON.parse(log));
  }
}

describe('Structured Logging Value Demonstration', () => {

  describe('InadequateLoggingService (The Gap)', () => {
    test('produces unstructured, context-free, and unparseable logs', () => {
      // We have to temporarily hijack console.log to capture the output.
      const originalConsoleLog = console.log;
      const capturedLogs = [];
      console.log = (msg) => capturedLogs.push(msg);

      const service = new InadequateLoggingService();
      service.processUserData(123);

      // Restore the original console.log
      console.log = originalConsoleLog;

      // ASSERTING THE PROBLEM: The logs are just simple strings.
      // It's impossible to query for "all logs for userId 123" without brittle string matching.
      // It's impossible to ask for "all logs with the level 'error'".
      expect(capturedLogs).toEqual([
        'Starting to process user data for user ID: 123',
        'Fetching data for user 123 from the database...',
        '...Data fetched successfully.',
        'Enriching data for user 123...',
        '...Enrichment complete.',
        'Finished processing user data for user ID: 123',
      ]);
    });
  });

  describe('ObservableService (The Solution)', () => {
    let mockOutputStream;
    let baseLogger;
    let service;

    beforeEach(() => {
      mockOutputStream = new MockOutputStream();
      // The logger is instantiated with our mock stream, so we can capture its output.
      baseLogger = new StructuredLogger({ service: 'user-service' }, mockOutputStream);
      service = new ObservableService(baseLogger);
    });

    test('produces structured, context-rich, and machine-parseable logs', () => {
      // We simulate a request coming in for a specific user, with a unique traceId.
      const traceId = 'abc-123-xyz-789';
      const loggerWithContext = baseLogger.withContext({ traceId });
      const serviceWithContext = new ObservableService(loggerWithContext);

      serviceWithContext.processUserData(456);

      const parsedLogs = mockOutputStream.getParsedLogs();

      // ASSERTING THE VALUE:
      // 1. Every log entry is a structured JSON object.
      // 2. Every log entry automatically contains the shared context (`service`, `traceId`).
      // 3. Every log entry for this specific request automatically contains the request context (`userId`).
      parsedLogs.forEach(log => {
        expect(log.timestamp).toBeDefined();
        expect(log.level).toBeDefined();
        expect(log.service).toBe('user-service');
        expect(log.traceId).toBe(traceId);
        expect(log.userId).toBe(456);
      });

      // 4. We can now easily and reliably query for specific information.
      const errorLogs = parsedLogs.filter(log => log.level === 'error');
      const dbLogs = parsedLogs.filter(log => log.message === 'Data fetched successfully');

      expect(errorLogs.length).toBe(0);
      expect(dbLogs.length).toBe(1);
      expect(dbLogs[0].db_latency_ms).toBe(55); // We can even extract metrics!
    });
  });
});
