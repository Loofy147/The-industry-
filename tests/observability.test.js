const {
  MessageBus
} = require('../src/message_bus');
const {
  UserLogic
} = require('../systems/user_service/user_logic');
const {
  UserRepository
} = require('../src/user_repository');
const {
  EventStore
} = require('../src/event_store');
const {
  NotificationHandler
} = require('../systems/notification_service/notification_handler');
const {
  baseLogger
} = require('../src/structured_logger');

describe('Observability and Distributed Tracing', () => {
  let messageBus;
  let userLogic;
  let notificationHandler;

  it('should propagate a single traceId across asynchronous, message-driven services', async () => {
    // --- Test Setup ---
    // 1. Arrange: Spy on the logger's output stream to capture all log entries.
    const logSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => {});

    // 2. Set up the infrastructure.
    messageBus = new MessageBus();
    const eventStore = new EventStore(messageBus);
    const userRepository = new UserRepository(eventStore);
    userLogic = new UserLogic(userRepository, messageBus);
    notificationHandler = new NotificationHandler(messageBus);

    // 3. Connect the systems.
    eventStore.subscribeToAllEvents();
    notificationHandler.subscribe();

    // --- Act ---
    // Dispatch a command to the user_service.
    await userLogic.registerUser('trace-test@example.com', 'a-valid-password');

    // --- Assert ---
    // 1. Find the traceId from the first log message (the start of the trace).
    const firstLogCall = logSpy.mock.calls[0][0];
    const firstLogEntry = JSON.parse(firstLogCall);
    const traceId = firstLogEntry.traceId;

    expect(traceId).toBeDefined();

    // 2. Filter all captured log messages to find those related to our trace.
    const traceLogs = logSpy.mock.calls
      .map(call => JSON.parse(call[0]))
      .filter(log => log.traceId === traceId);

    // 3. Verify that logs from both services are present for this trace.
    const operations = traceLogs.map(log => log.operationName);
    expect(operations).toContain('UserLogic.registerUser');
    expect(operations).toContain('NotificationHandler.handleUserRegistered');

    // 4. Verify that the spanId changes between services, but the traceId does not.
    const userLogicLog = traceLogs.find(log => log.operationName === 'UserLogic.registerUser');
    const notificationLog = traceLogs.find(log => log.operationName === 'NotificationHandler.handleUserRegistered');
    expect(userLogicLog.spanId).not.toBe(notificationLog.spanId);

    // Clean up the spy.
    logSpy.mockRestore();
  });
});