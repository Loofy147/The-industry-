const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const { schemaRegistry } = require('./schema_registry');

class SchemaValidator {
  constructor() {
    this.ajv = new Ajv();
    addFormats(this.ajv); // Add formats like 'email' and 'uuid'
  }

  /**
   * Validates a payload against a registered schema.
   * @param {string} schemaName The name of the schema to use.
   * @param {number} version The version of the schema.
   * @param {object} payload The data to validate.
   * @returns {{ valid: boolean, errors: object|null }}
   */
  validate(schemaName, version, payload) {
    const schema = schemaRegistry.getSchema(schemaName, version);
    if (!schema) {
      throw new Error(`Schema "${schemaName}" version ${version} not found.`);
    }

    const validate = this.ajv.compile(schema);
    const valid = validate(payload);

    return {
      valid,
      errors: valid ? null : validate.errors,
    };
  }
}

const schemaValidator = new SchemaValidator();

module.exports = {
  SchemaValidator,
  schemaValidator,
};
