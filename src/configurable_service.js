const { configService } = require('./config_service');

/**
 * This service demonstrates the power of dynamic configuration.
 * It subscribes to the ConfigService to adjust its behavior in real-time.
 */
class ConfigurableService {
  constructor(config = configService) {
    // Set initial timeout from the service
    this.apiTimeout = config.get('API_TIMEOUT_MS');
    console.log(`ConfigurableService: Initialized with timeout: ${this.apiTimeout}ms`);

    // Subscribe to future changes for the API_TIMEOUT_MS key
    config.subscribe('API_TIMEOUT_MS', (newTimeout) => {
      this.apiTimeout = newTimeout;
      console.log(`ConfigurableService: Timeout dynamically updated to: ${this.apiTimeout}ms`);
    });
  }

  /**
   * Simulates making an API call using the dynamically configured timeout.
   */
  makeApiCall() {
    console.log(`Making API call with dynamic timeout: ${this.apiTimeout}ms...`);
    // In a real application, a library like 'axios' would be configured here.
    return { success: true, timeout: this.apiTimeout };
  }
}

module.exports = { ConfigurableService };
