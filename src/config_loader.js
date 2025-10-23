const fs = require('fs');
const path = require('path');

/**
 * This module is the core of the shared solution for configuration management.
 * It loads configuration from files and environment variables, providing a unified
 * and secure way to manage application config.
 */
function loadConfig() {
  const env = process.env.NODE_ENV || 'development';
  const configPath = path.resolve(__dirname, '../config');

  // 1. Load the default configuration
  const defaultConfig = JSON.parse(fs.readFileSync(path.join(configPath, 'default.json'), 'utf8'));

  // 2. Load the environment-specific configuration
  const envConfigPath = path.join(configPath, `${env}.json`);
  const envConfig = fs.existsSync(envConfigPath)
    ? JSON.parse(fs.readFileSync(envConfigPath, 'utf8'))
    : {};

  // 3. Merge the configurations (environment-specific values override defaults)
  // A deep merge would be better for a real application.
  const mergedConfig = {
    ...defaultConfig,
    ...envConfig,
    database: { ...defaultConfig.database, ...envConfig.database },
    api: { ...defaultConfig.api, ...envConfig.api },
    logging: { ...defaultConfig.logging, ...envConfig.logging },
  };

  // 4. Override with environment variables for secrets and sensitive values
  // This is the most secure way to handle secrets.
  if (process.env.API_KEY) {
    mergedConfig.api.apiKey = process.env.API_KEY;
  }
  if (process.env.LOG_LEVEL) {
    mergedConfig.logging.level = process.env.LOG_LEVEL;
  }

  return mergedConfig;
}

const config = loadConfig();

module.exports = { config, loadConfig };
