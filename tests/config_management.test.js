const { HardcodedConfigService } = require('../src/hardcoded_config_service');
const { ConfigurableService } = require('../src/configurable_service');
const { loadConfig } = require('../src/config_loader');

describe('Configuration Management Gap', () => {

  describe('HardcodedConfigService (The Gap)', () => {
    test('is rigid and insecure', () => {
      const service = new HardcodedConfigService();

      // Gap 1 (Reliability): The config is hard-coded.
      // We can't test it with a different database host.
      expect(service.config.database.host).toBe('localhost');

      // Gap 2 (Security): Secrets are exposed directly on the object.
      expect(service.config.api.apiKey).toBe('SECRET_API_KEY_12345');
    });
  });

  describe('ConfigurableService (The Solution)', () => {

    // Store original env vars to avoid test pollution
    const originalEnv = process.env;

    beforeEach(() => {
      // Reset the process.env object before each test
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      // Restore the original process.env object after all tests
      process.env = originalEnv;
    });

    test('loads the correct configuration for the development environment', () => {
      process.env.NODE_ENV = 'development';
      const config = loadConfig();
      const service = new ConfigurableService(config);

      // Solves Gap 1 (Reliability): Config is loaded for the specific environment.
      expect(service.config.database.host).toBe('localhost');
      // It also correctly inherits from the default config.
      expect(service.config.api.timeout).toBe(5000);
      // And it overrides defaults.
      expect(service.config.logging.level).toBe('debug');
    });

    test('loads the correct configuration for the production environment', () => {
      process.env.NODE_ENV = 'production';
      const config = loadConfig();
      const service = new ConfigurableService(config);

      // Solves Gap 1 (Reliability): Config is loaded for the specific environment.
      expect(service.config.database.host).toBe('prod.db.internal');
      expect(service.config.logging.level).toBe('warn');
    });

    test('securely overrides configuration with environment variables', () => {
      process.env.NODE_ENV = 'production';
      // Solves Gap 2 (Security): Secrets are provided via the environment, not in code.
      process.env.API_KEY = 'prod_secret_from_env';
      // Solves Gap 3 (Rigidity): Operational values can also be changed without a redeploy.
      process.env.LOG_LEVEL = 'error';

      const config = loadConfig();
      const service = new ConfigurableService(config);

      expect(service.config.api.apiKey).toBe('prod_secret_from_env');
      expect(service.config.logging.level).toBe('error');
    });

    test('throws an error if a required secret is missing', () => {
      process.env.NODE_ENV = 'production';
      // Unset the API_KEY to simulate a misconfigured environment
      delete process.env.API_KEY;

      const config = loadConfig();
      const service = new ConfigurableService(config);

      // The service should fail fast if a required secret is not provided.
      expect(() => service.makeApiCall())
        .toThrow('API key is missing. Ensure it is set via environment variable.');
    });
  });
});
