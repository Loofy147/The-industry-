const { MonolithicUserService } = require('../src/monolithic_user_service');
const { UserLogic } = require('../src/user_logic');

describe('Single Responsibility Principle Refactor', () => {

  // This describes the testing problem with the monolithic, non-SRP approach.
  describe('MonolithicUserService (Violates SRP)', () => {
    test('is difficult to unit test without real dependencies', async () => {
      // To test this class, we need to provide a fake database and a fake emailer.
      // What if we only want to test the validation logic? We still have to provide
      // mocks for dependencies we don't care about for this specific test.
      // This makes the test more complex and brittle.

      const mockDb = { save: jest.fn().mockResolvedValue({ id: 1 }) };
      const mockEmailer = { send: jest.fn().mockResolvedValue(true) };

      const service = new MonolithicUserService(mockDb, mockEmailer);

      // We are testing the password validation, but the mocks are required.
      await expect(service.registerUser('test@test.com', 'short'))
        .rejects.toThrow('Password must be at least 8 characters long.');

      // We didn't want to test the db or emailer, but our test setup depends on them.
      expect(mockDb.save).not.toHaveBeenCalled();
      expect(mockEmailer.send).not.toHaveBeenCalled();
    });
  });

  // This demonstrates the "shared solution": testing a module that adheres to SRP.
  describe('UserLogic (Adheres to SRP)', () => {
    test('allows for simple, focused unit testing of business logic', async () => {
      // We can test the business logic (validation) without creating any mocks
      // for the database or email service. The dependencies are decoupled.

      // We can pass `null` or `undefined` for the dependencies because the part of the code
      // we are testing (the validation) does not use them.
      const userLogic = new UserLogic(null, null);

      // This test is now extremely simple. It has no knowledge of external systems.
      await expect(userLogic.registerUser('test@test.com', 'short'))
        .rejects.toThrow('Password must be at least 8 characters long.');

      await expect(userLogic.registerUser('invalid-email', 'longenough'))
        .rejects.toThrow('Invalid email address.');
    });

    test('allows for easy mocking to test orchestration logic', async () => {
      // When we want to test the *orchestration*, we can provide simple mocks.
      const mockRepo = {
        createUser: jest.fn().mockResolvedValue({ id: 1, email: 'test@test.com' })
      };
      const mockEmailer = {
        sendWelcomeEmail: jest.fn().mockResolvedValue(true)
      };

      const userLogic = new UserLogic(mockRepo, mockEmailer);

      await userLogic.registerUser('test@test.com', 'a-valid-password');

      // The test is a clear and simple verification of the orchestration.
      expect(mockRepo.createUser).toHaveBeenCalledWith('test@test.com', 'a-valid-password');
      expect(mockEmailer.sendWelcomeEmail).toHaveBeenCalledWith('test@test.com');
    });
  });
});
