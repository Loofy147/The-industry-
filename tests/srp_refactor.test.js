const { MonolithicUserService } = require('../src/monolithic_user_service');
const { UserLogic } = require('../systems/user_service/user_logic');
const { User } = require('../src/user_aggregate');

describe('Single Responsibility Principle Refactor to a Message-Driven Handler', () => {

  describe('MonolithicUserService (Violates SRP)', () => {
    // This test remains the same as a valuable contrast.
    test('is difficult to unit test without real dependencies', async () => {
      const mockDb = { save: jest.fn().mockResolvedValue({ id: 1 }) };
      const mockEmailer = { send: jest.fn().mockResolvedValue(true) };
      const service = new MonolithicUserService(mockDb, mockEmailer);
      await expect(service.registerUser('test@test.com', 'short'))
        .rejects.toThrow('Password must be at least 8 characters long.');
    });
  });

  describe('UserLogic (Message-Driven Command Handler)', () => {
    // This test remains a valid unit test for the aggregate's validation logic.
    test('throws an error for invalid input, preventing event creation', async () => {
      const userLogic = new UserLogic(null, null);
      await expect(userLogic.registerUser('test@test.com', 'short'))
        .rejects.toThrow('Password must be at least 8 characters long.');
    });

    // This test is rewritten to verify the handler's new primary responsibility:
    // publishing the event.
    test('publishes a UserRegistered event to the message bus', async () => {
      const email = 'test@test.com';
      const password = 'a-valid-password';

      // Arrange:
      // The handler's only external dependency for this workflow is the message bus.
      // The repository is not used when creating a new aggregate.
      const mockBus = {
        publish: jest.fn()
      };
      const userLogic = new UserLogic(null, mockBus);

      // Act:
      const newUserId = await userLogic.registerUser(email, password);

      // Assert:
      // 1. The message bus was called to publish the event.
      expect(mockBus.publish).toHaveBeenCalledTimes(1);
      const [topic, publishedEvent] = mockBus.publish.mock.calls[0];

      // 2. The event has the correct topic and structure.
      expect(topic).toBe('UserRegistered');
      expect(publishedEvent.type).toBe('UserRegistered');
      expect(publishedEvent.aggregateId).toBe(newUserId);
      expect(publishedEvent.data.email).toBe(email);
    });
  });
});
