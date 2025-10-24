const { configService } = require('./config_service');

/**
 * Provides a clean, high-level API for checking feature flags.
 * It abstracts the underlying configuration service and naming conventions.
 */
class FeatureFlagManager {
  constructor(config) {
    this.config = config;
  }

  /**
   * Checks if a feature is enabled.
   * @param {string} featureName The name of the feature to check (e.g., 'new-checkout-flow').
   * @returns {boolean} `true` if the feature is enabled, `false` otherwise.
   */
  isEnabled(featureName) {
    const key = `FEATURE_${featureName.toUpperCase()}_ENABLED`;
    return this.config.get(key) === true;
  }
}

const featureFlagManager = new FeatureFlagManager(configService);

module.exports = { FeatureFlagManager, featureFlagManager };
