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
  emailService
} = require('../systems/notification_service/email_service');

describe('Multi-System Communication via Message Bus', () => {
  let messageBus;
  let eventStore;
  let userRepository;
  let userLogic; // Represents the user_service
  let notificationHandler; // Represents the notification_service

  beforeEach(() => {
    // 1. Create the infrastructure.
    messageBus = new MessageBus();
    eventStore = new EventStore(messageBus);
    userRepository = new UserRepository(eventStore);

    // 2. Instantiate the services.
    userLogic = new UserLogic(userRepository, messageBus);
    notificationHandler = new NotificationHandler(messageBus);

    // 3. Connect the systems to the bus.
    eventStore.subscribeToAllEvents();
    notificationHandler.subscribe();
  });

  it('should register a user in one system and trigger a notification in another', async () => {
    const email = 'multi-system-test@example.com';
    const password = 'a-valid-password';

    // Arrange:
    // Spy on the email service, which is the final effect of the notification system.
    const sendEmailSpy = jest.spyOn(emailService, 'sendWelcomeEmail').mockResolvedValue(undefined);

    // Act:
    // A client sends a command to the user_service.
    await userLogic.registerUser(email, password);

    // Assert:
    // 1. The user_service did its job (the event was persisted).
    // We can verify this by checking the event store.
    const events = eventStore.readAllEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('UserRegistered');
    expect(events[0].data.email).toBe(email);

    // 2. The notification_service reacted to the event and did its job.
    // The NotificationHandler was subscribed to the bus and should have received
    // the event and called the email service.
    expect(sendEmailSpy).toHaveBeenCalledTimes(1);
    expect(sendEmailSpy).toHaveBeenCalledWith(email);
  });
});