/**
 * A simplified and secure configuration loader for a containerized environment.
 * It prioritizes environment variables, which is a best practice for modern,
 * cloud-native applications (12-Factor App).
 */
let config;

function loadConfig() {
  config = {
    // Application port for the frontend server
    port: process.env.PORT || 3000,
    // WebSocket port for real-time communication
    websocketPort: process.env.WEBSOCKET_PORT || 8080,
    // API Gateway port
    apiGatewayPort: process.env.API_GATEWAY_PORT || 8081,
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
    },
    // JWT Secret for token signing
    jwtSecret: process.env.JWT_SECRET || 'a-secure-default-secret-key',
  };

  return config;
}

function clear() {
  config = null;
}

module.exports = {
  config: new Proxy({}, {
    get: (target, name) => {
      if (!config) {
        loadConfig();
      }
      return config[name];
    }
  }),
  loadConfig,
  clear,
};
