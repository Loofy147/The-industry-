const { sagaOrchestrator } = require('../src/saga_orchestrator');
const { emailService } = require('../systems/notification_service/email_service');
const { UserLogic } = require('../systems/user_service/user_logic');
const { defineUserRegistrationSaga, USER_REGISTRATION_SAGA } = require('../src/user_registration_saga');

describe('SagaOrchestrator (CQRS-Compliant)', () => {
  let mockUserLogic;

  beforeEach(() => {
    // Before each test, create a fresh mock of the UserLogic.
    mockUserLogic = {
      registerUser: jest.fn(),
      deactivateUser: jest.fn(),
    };

    // Define the saga with the mock dependency.
    defineUserRegistrationSaga(mockUserLogic);
  });

  it('should successfully execute by dispatching commands', async () => {
    const email = 'test@example.com';
    const password = 'password123';
    const newUserId = 'user-123';

    // Arrange: Configure the mock to simulate success.
    mockUserLogic.registerUser.mockResolvedValue(newUserId);
    const sendEmailSpy = jest.spyOn(emailService, 'sendWelcomeEmail').mockResolvedValue(undefined);

    // Act: Execute the saga.
    await sagaOrchestrator.execute(USER_REGISTRATION_SAGA, {
      username: email,
      password: password,
    });

    // Assert: Verify the correct methods were called on the mock.
    expect(mockUserLogic.registerUser).toHaveBeenCalledWith(email, password);
    expect(sendEmailSpy).toHaveBeenCalledWith(email);
    expect(mockUserLogic.deactivateUser).not.toHaveBeenCalled();
  });

  it('should compensate by dispatching a compensating command if a step fails', async () => {
    const email = 'test-fail@example.com';
    const password = 'password123';
    const newUserId = 'user-456';

    // Arrange: Configure the mocks for the failure scenario.
    mockUserLogic.registerUser.mockResolvedValue(newUserId);
    jest.spyOn(emailService, 'sendWelcomeEmail').mockImplementation(async () => {
      throw new Error('Email service is down');
    });

    // Act & Assert:
    await expect(
      sagaOrchestrator.execute(USER_REGISTRATION_SAGA, {
        username: email,
        password: password,
        userId: newUserId,
      })
    ).rejects.toThrow('Saga "USER_REGISTRATION_SAGA" failed and was rolled back.');

    // Assert:
    expect(mockUserLogic.registerUser).toHaveBeenCalledWith(email, password);
    expect(mockUserLogic.deactivateUser).toHaveBeenCalledWith(newUserId);
  });
});
