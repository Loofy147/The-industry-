/**
 * A simple, in-memory Schema Registry.
 * In a real-world, distributed system, this would be a standalone,
 * highly-available service (e.g., Confluent Schema Registry).
 */
class SchemaRegistry {
  constructor() {
    this.schemas = new Map(); // schemaName -> [version1, version2, ...]
  }

  /**
   * Registers a new version of a schema.
   * @param {string} schemaName The name of the schema (e.g., 'UserRegistered').
   * @param {object} schema The JSON Schema object.
   */
  register(schemaName, schema) {
    if (!this.schemas.has(schemaName)) {
      this.schemas.set(schemaName, []);
    }
    const versions = this.schemas.get(schemaName);
    // For this simple implementation, the version is just the array index + 1.
    const version = versions.length + 1;
    versions.push(schema);
    console.log(`SchemaRegistry: Registered schema "${schemaName}" version ${version}.`);
  }

  /**
   * Retrieves a specific version of a schema.
   * @param {string} schemaName The name of the schema.
   * @param {number} version The version number.
   * @returns {object|undefined} The schema object or undefined if not found.
   */
  getSchema(schemaName, version) {
    const versions = this.schemas.get(schemaName);
    if (!versions || !versions[version - 1]) {
      return undefined;
    }
    return versions[version - 1];
  }

  /**
   * Retrieves the latest version of a schema.
   * @param {string} schemaName The name of the schema.
   * @returns {object|undefined} The latest schema object or undefined if not found.
   */
  getLatestSchema(schemaName) {
    const versions = this.schemas.get(schemaName);
    if (!versions || versions.length === 0) {
      return undefined;
    }
    return versions[versions.length - 1];
  }
}

const schemaRegistry = new SchemaRegistry();

module.exports = {
  SchemaRegistry,
  schemaRegistry,
};
