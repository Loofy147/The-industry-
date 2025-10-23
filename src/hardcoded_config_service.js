/**
 * This module represents a service with hard-coded configuration.
 * It demonstrates the multi-gap problem:
 * - Gap 1 (Reliability): The database host is hard-coded for a specific environment.
 * - Gap 2 (Security): A secret API key is hard-coded directly in the source.
 * - Gap 3 (Rigidity): The logging level is hard-coded, requiring a code change to be modified.
 */
class HardcodedConfigService {
  constructor() {
    // VIOLATION: Configuration is mixed directly with code.
    this.config = {
      database: {
        host: 'localhost', // Fails in any other environment
        port: 5432,
      },
      api: {
        apiKey: 'SECRET_API_KEY_12345', // Security vulnerability
        timeout: 5000,
      },
      logging: {
        level: 'info', // Operationally rigid
      },
    };
  }

  connectToDatabase() {
    const { host, port } = this.config.database;
    console.log(`Connecting to database at ${host}:${port}...`);
    // Database connection logic would go here
    return true;
  }

  makeApiCall() {
    const { apiKey, timeout } = this.config.api;
    console.log(`Making API call with key: ${apiKey} and timeout: ${timeout}ms...`);
    // API call logic would go here
    return { success: true };
  }
}

module.exports = { HardcodedConfigService };
