const { ConfigService } = require('../src/config_service');
const { ConfigurableService } = require('../src/configurable_service');
const { FeatureFlagManager } = require('../src/feature_flag_manager');

describe('Dynamic Configuration and Feature Flags', () => {
  let configService;
  let featureFlagManager;

  beforeEach(() => {
    // Create a fresh config service for each test to ensure isolation
    const initialConfig = {
      API_TIMEOUT_MS: 1000,
      FEATURE_NEW_FEATURE_ENABLED: false,
    };
    configService = new ConfigService(initialConfig);
    featureFlagManager = new FeatureFlagManager(configService);
  });

  it('should initialize a service with the initial configuration', () => {
    const service = new ConfigurableService(configService);
    const result = service.makeApiCall();
    expect(result.timeout).toBe(1000);
  });

  it('should dynamically update service behavior when configuration changes', () => {
    const service = new ConfigurableService(configService);

    // Verify initial state
    expect(service.makeApiCall().timeout).toBe(1000);

    // Act: Update the configuration in the central service
    configService.update({ API_TIMEOUT_MS: 3000 });

    // Assert: The service's behavior should change immediately without a restart
    expect(service.makeApiCall().timeout).toBe(3000);
  });

  it('should correctly report a disabled feature flag', () => {
    expect(featureFlagManager.isEnabled('new_feature')).toBe(false);
  });

  it('should reflect a dynamically enabled feature flag', () => {
    // Verify initial state
    expect(featureFlagManager.isEnabled('new_feature')).toBe(false);

    // Act: Enable the feature flag via the config service
    configService.update({ FEATURE_NEW_FEATURE_ENABLED: true });

    // Assert: The feature flag manager should now report the feature as enabled
    expect(featureFlagManager.isEnabled('new_feature')).toBe(true);
  });
});
