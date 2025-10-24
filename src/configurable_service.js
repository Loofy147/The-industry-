const { loadConfig } = require('./config_loader');

/**
 * This service demonstrates the "shared solution" to configuration management.
 * It is decoupled from the source of the configuration.
 */
class ConfigurableService {
  constructor() {
    // It loads its own configuration, but it could also be injected.
    this.config = loadConfig();
  }

  /**
   * Checks if a secret API key is present and valid.
   * This is a simple example of a business logic check that depends on config.
   */
  isApiKeyValid() {
    // Solves Gap 2 (Security): Secrets are not hardcoded.
    if (!this.config.api.apiKey || this.config.api.apiKey === 'default-secret-key') {
      throw new Error('API key is missing. Ensure it is set via environment variable.');
    }
    return true;
  }

  /**
   * Simulates making an API call using the configured key.
   */
  makeApiCall() {
    this.isApiKeyValid(); // Fails fast if not configured.

    console.log(`Making API call with key: *** and timeout: ${this.config.api.timeout}ms...`);
    // In a real application, you would use a library like 'axios' or 'node-fetch'
    // to make an HTTP request here, configured with the API key and timeout.
    return { success: true, data: 'some-data' };
  }
}

module.exports = { ConfigurableService };
