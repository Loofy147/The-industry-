/**
 * A simplified and secure configuration loader for a containerized environment.
 * It prioritizes environment variables, which is a best practice for modern,
 * cloud-native applications (12-Factor App).
 */
function loadConfig() {
  const config = {
    // Application port for the frontend server
    port: process.env.PORT || 3000,
    // WebSocket port for real-time communication
    websocketPort: process.env.WEBSOCKET_PORT || 8080,
    // Logging level
    logging: {
      level: process.env.LOG_LEVEL || 'info',
    },
    // Example of a secret that should be injected into the environment
    api: {
      apiKey: process.env.API_KEY || 'default-secret-key',
    },
    // Example of a connection string for a message broker
    messageBroker: {
      url: process.env.MESSAGE_BROKER_URL || 'in-memory',
    }
  };

  return config;
}

const config = loadConfig();

module.exports = { config, loadConfig };
