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
    test('initializes with the default timeout', () => {
      const service = new ConfigurableService();
      expect(service.apiTimeout).toBe(5000);
      const result = service.makeApiCall();
      expect(result.timeout).toBe(5000);
    });
  });
});