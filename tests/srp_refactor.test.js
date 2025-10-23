const { MonolithicUserService } = require('../src/monolithic_user_service');
const { UserLogic } = require('../src/user_logic');
const { User } = require('../src/user_aggregate');

// This test suite now contrasts the monolithic service with the CQRS/ES command handler.
describe('Single Responsibility Principle Refactor to CQRS', () => {

  describe('MonolithicUserService (Violates SRP)', () => {
    // This test remains the same, as it's a valuable contrast.
    test('is difficult to unit test without real dependencies', async () => {
      const mockDb = { save: jest.fn().mockResolvedValue({ id: 1 }) };
      const mockEmailer = { send: jest.fn().mockResolvedValue(true) };
      const service = new MonolithicUserService(mockDb, mockEmailer);
      await expect(service.registerUser('test@test.com', 'short'))
        .rejects.toThrow('Password must be at least 8 characters long.');
      expect(mockDb.save).not.toHaveBeenCalled();
      expect(mockEmailer.send).not.toHaveBeenCalled();
    });
  });

  describe('UserLogic (CQRS Command Handler)', () => {
    // This test is updated to reflect that validation now happens inside the aggregate.
    test('throws an error for invalid input, preventing event creation', async () => {
      const userLogic = new UserLogic(null); // No repository needed for this validation test.
      await expect(userLogic.registerUser('test@test.com', 'short'))
        .rejects.toThrow('Password must be at least 8 characters long.');
    });

    // This is the core test for the command handler's responsibility.
    test('creates a UserRegistered event and saves it via the repository', async () => {
      const email = 'test@test.com';
      const password = 'a-valid-password';

      // Arrange:
      // Mock the repository's save method. This is the only dependency.
      const mockRepo = {
        save: jest.fn().mockResolvedValue(undefined)
      };
      const userLogic = new UserLogic(mockRepo);

      // Act:
      const newUserId = await userLogic.registerUser(email, password);

      // Assert:
      // 1. A new user ID was returned.
      expect(newUserId).toBeDefined();
      expect(typeof newUserId).toBe('string');

      // 2. The repository's save method was called exactly once.
      expect(mockRepo.save).toHaveBeenCalledTimes(1);

      // 3. The event saved has the correct structure and data.
      const savedEvent = mockRepo.save.mock.calls[0][0];
      expect(savedEvent.type).toBe('UserRegistered');
      expect(savedEvent.aggregateId).toBe(newUserId);
      expect(savedEvent.data.email).toBe(email);
      expect(savedEvent.data.password).toBe(password);
    });
  });
});
