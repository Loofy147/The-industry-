const fs = require('fs');
const path = require('path');

/**
 * Discovers and loads all service manifests to create a runtime map of the system's architecture.
 */
class ServiceRegistry {
  constructor() {
    this.services = new Map();
    this.discoverServices();
  }

  /**
   * Scans the `systems` directory for `service-manifest.json` files and loads them.
   */
  discoverServices() {
    const systemsDir = path.join(__dirname, '../systems');
    if (!fs.existsSync(systemsDir)) {
      console.warn('ServiceRegistry: `systems` directory not found. No services will be discovered.');
      return;
    }

    const serviceDirs = fs.readdirSync(systemsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const dir of serviceDirs) {
      const manifestPath = path.join(systemsDir, dir, 'service-manifest.json');
      if (fs.existsSync(manifestPath)) {
        try {
          const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
          const manifest = JSON.parse(manifestContent);
          this.register(manifest);
        } catch (error) {
          console.error(`ServiceRegistry: Error loading manifest for service "${dir}":`, error);
        }
      }
    }
  }

  /**
   * Registers a service from its manifest.
   * @param {object} manifest The service manifest.
   */
  register(manifest) {
    if (!manifest.name) {
      console.error('ServiceRegistry: Manifest is missing a `name` attribute.');
      return;
    }
    this.services.set(manifest.name, manifest);
    console.log(`ServiceRegistry: Registered service "${manifest.name}".`);
  }

  /**
   * Gets the manifest for a specific service.
   * @param {string} name The name of the service.
   * @returns {object|undefined} The service manifest.
   */
  get(name) {
    return this.services.get(name);
  }

  /**
   * Returns a map of all registered services.
   * @returns {Map<string, object>}
   */
  getAll() {
    return this.services;
  }
}

const serviceRegistry = new ServiceRegistry();

module.exports = { ServiceRegistry, serviceRegistry };
