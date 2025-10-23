const { sagaOrchestrator } = require('../src/saga_orchestrator');
const { emailService } = require('../src/email_service');
const { UserLogic } = require('../src/user_logic');

// Mock the UserLogic module *before* it's imported by any other module.
jest.mock('../src/user_logic');

// Now, when we require the saga, it will get the mocked version of UserLogic.
// It will create a singleton instance of the mock, which we can then access.
const { USER_REGISTRATION_SAGA } = require('../src/user_registration_saga');


describe('SagaOrchestrator (CQRS-Compliant)', () => {
  // The user_registration_saga module creates a singleton instance of the mocked UserLogic
  // when it is first required. We need to get a stable reference to that specific instance
  // to configure its behavior and assert that it was called correctly.
  const mockUserLogicInstance = UserLogic.mock.instances[0];

  beforeEach(() => {
    // Before each test, clear the history of the mock methods on the singleton instance.
    mockUserLogicInstance.registerUser.mockClear();
    mockUserLogicInstance.deactivateUser.mockClear();
    // also restore any other spies (e.g., on emailService)
    jest.restoreAllMocks();
  });

  it('should successfully execute by dispatching commands', async () => {
    const email = 'test@example.com';
    const password = 'password123';
    const newUserId = 'user-123';

    // Arrange: Configure the mock methods on our singleton instance.
    mockUserLogicInstance.registerUser.mockResolvedValue(newUserId);
    const sendEmailSpy = jest.spyOn(emailService, 'sendWelcomeEmail').mockResolvedValue(undefined);

    // Act: Execute the saga.
    await sagaOrchestrator.execute(USER_REGISTRATION_SAGA, {
      username: email,
      password: password,
    });

    // Assert: Verify the correct methods were called on the singleton instance.
    expect(mockUserLogicInstance.registerUser).toHaveBeenCalledWith(email, password);
    expect(sendEmailSpy).toHaveBeenCalledWith(email);
    expect(mockUserLogicInstance.deactivateUser).not.toHaveBeenCalled();
  });

  it('should compensate by dispatching a compensating command if a step fails', async () => {
    const email = 'test-fail@example.com';
    const password = 'password123';
    const newUserId = 'user-456';

    // Arrange: Configure the mock methods on our singleton instance.
    mockUserLogicInstance.registerUser.mockResolvedValue(newUserId);
    jest.spyOn(emailService, 'sendWelcomeEmail').mockImplementation(async () => {
      throw new Error('Email service is down');
    });

    // Act & Assert:
    await expect(
      sagaOrchestrator.execute(USER_REGISTRATION_SAGA, {
        username: email,
        password: password,
      })
    ).rejects.toThrow('Saga "USER_REGISTRATION_SAGA" failed and was rolled back.');

    // Assert:
    expect(mockUserLogicInstance.registerUser).toHaveBeenCalledWith(email, password);
    expect(mockUserLogicInstance.deactivateUser).toHaveBeenCalledWith(newUserId);
  });
});
