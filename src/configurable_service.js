/**
 * This module represents the refactored, configurable service.
 * It is completely decoupled from its configuration values.
 * It adheres to the Twelve-Factor App methodology by receiving its config
 * from the outside (via dependency injection).
 */
class ConfigurableService {
  constructor(config) {
    // The service depends on a configuration object, not on hard-coded values.
    this.config = config;
  }

  connectToDatabase() {
    const { host, port } = this.config.database;
    console.log(`Connecting to database at ${host}:${port}...`);
    // Database connection logic would go here
    return true;
  }

  makeApiCall() {
    const { apiKey, timeout } = this.config.api;
    if (!apiKey) {
      throw new Error('API key is missing. Ensure it is set via environment variable.');
    }
    console.log(`Making API call with key: *** and timeout: ${timeout}ms...`); // Log safely
    // API call logic would go here
    return { success: true };
  }
}

module.exports = { ConfigurableService };
