/**
 * Simulates a central, dynamic configuration service.
 * In a real-world scenario, this would be backed by a service like AWS AppConfig,
 * LaunchDarkly, or a simple Redis store.
 */
class ConfigService {
  constructor(initialConfig = {}) {
    this.config = initialConfig;
    this.subscriptions = new Map();
  }

  /**
   * Gets the entire configuration object or a specific key.
   * @param {string} [key] The configuration key to retrieve. If omitted, returns the whole object.
   * @returns {*} The configuration value or the entire config object.
   */
  get(key) {
    if (key) {
      return this.config[key];
    }
    return this.config;
  }

  /**
   * Updates one or more configuration values and notifies subscribers.
   * @param {object} newConfig An object containing the keys and new values to update.
   */
  update(newConfig) {
    const changes = {};
    for (const key in newConfig) {
      if (this.config[key] !== newConfig[key]) {
        changes[key] = newConfig[key];
        this.config[key] = newConfig[key];
      }
    }

    if (Object.keys(changes).length > 0) {
      console.log('ConfigService: Configuration updated.', changes);
      this._notify(changes);
    }
  }

  /**
   * Subscribes a callback to changes for a specific configuration key.
   * @param {string} key The configuration key to watch.
   * @param {Function} callback The function to call when the value changes.
   */
  subscribe(key, callback) {
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, []);
    }
    this.subscriptions.get(key).push(callback);
  }

  /**
   * Notifies all subscribers of changes to the configuration.
   * @private
   */
  _notify(changes) {
    for (const key in changes) {
      if (this.subscriptions.has(key)) {
        this.subscriptions.get(key).forEach(callback => {
          callback(changes[key]);
        });
      }
    }
  }
}

// Export a singleton instance for the application to use.
const configService = new ConfigService({
  LOG_LEVEL: 'info',
  API_TIMEOUT_MS: 5000,
  FEATURE_NEW_CHECKOUT_FLOW_ENABLED: false,
});

module.exports = { ConfigService, configService };
