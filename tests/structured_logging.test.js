const {
  InadequateLoggingService
} = require('../src/inadequate_logging_service');
const {
  StructuredLogger
} = require('../src/structured_logger');
const {
  ObservableService
} = require('../src/observable_service');
const {
  setContext,
  CorrelationContext,
  getContext,
} = require('../src/observability');

describe('Structured Logging Value Demonstration', () => {

  // This test remains valid as a contrast.
  describe('InadequateLoggingService (The Problem)', () => {
    test('produces unstructured, context-poor, and unparseable logs', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const service = new InadequateLoggingService();
      service.processUserData(123);
      expect(consoleSpy).toHaveBeenCalledWith('Starting to process user data for user ID: 123');
      consoleSpy.mockRestore();
    });
  });

  // This test is updated to reflect the new observability pattern.
  describe('ObservableService (The Solution)', () => {
    test('produces structured logs that automatically include the active context', () => {
      const mockOutputStream = { write: jest.fn() };
      const testLogger = new StructuredLogger(getContext, { service: 'UserService' }, mockOutputStream);
      const service = new ObservableService(testLogger);
      const traceId = 'abc-123-xyz-789';

      // Arrange: Set a global correlation context *before* the operation runs.
      setContext(new CorrelationContext(traceId));

      // Act:
      service.processUserData(456);

      // Assert:
      // The logger, without any special decorators, automatically picks up the traceId.
      const logEntry = JSON.parse(mockOutputStream.write.mock.calls[0][0]);
      expect(logEntry.service).toBe('UserService');
      expect(logEntry.userId).toBe(456);
      expect(logEntry.traceId).toBe(traceId);

      // Clean up the context.
      setContext(null);
    });
  });
});
