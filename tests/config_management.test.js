const {
  HardcodedConfigService
} = require('../src/hardcoded_config_service');
const {
  ConfigurableService
} = require('../src/configurable_service');
const {
  loadConfig
} = require('../src/config_loader');

// Mock the config loader to control the environment for each test.
jest.mock('../src/config_loader');

describe('Configuration Management Gap', () => {

  describe('HardcodedConfigService (The Problem)', () => {
    test('is tightly coupled to hardcoded and insecure configuration', () => {
      const service = new HardcodedConfigService();
      // This test is brittle. If we change the hardcoded key, this test fails.
      // It's also dangerous because a real secret might be exposed in the test code.
      expect(service.makeApiCall().success).toBe(true);
    });
  });

  describe('ConfigurableService (The Solution)', () => {
    beforeEach(() => {
      // Reset the mock before each test.
      loadConfig.mockClear();
    });

    test('loads the correct configuration for a simple environment', () => {
      // Arrange:
      // We mock the loaded config to simulate a specific environment.
      loadConfig.mockReturnValue({
        port: 3000,
        api: {
          apiKey: 'test-key',
        },
      });

      // Act:
      const service = new ConfigurableService();

      // Assert:
      expect(service.config.port).toBe(3000);
      expect(service.config.api.apiKey).toBe('test-key');
    });

    test('throws an error if a required secret is missing', () => {
      // Arrange:
      // Simulate an environment where the secret is not provided.
      loadConfig.mockReturnValue({
        api: {
          apiKey: 'default-secret-key',
        },
      });
      const service = new ConfigurableService();

      // Act & Assert:
      // The service should fail fast if a required secret is not provided.
      expect(() => service.makeApiCall())
        .toThrow('API key is missing. Ensure it is set via environment variable.');
    });
  });
});