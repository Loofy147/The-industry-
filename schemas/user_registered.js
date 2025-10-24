const { schemaRegistry } = require('../src/schema_registry');

const SCHEMA_NAME = 'UserRegistered';

// Version 1 of the UserRegistered event schema.
const v1 = {
  type: 'object',
  properties: {
    // The aggregateId is required and must be a UUID.
    aggregateId: { type: 'string', format: 'uuid' },
    // The data payload.
    data: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8 },
        role: { type: 'string', enum: ['customer', 'admin'] },
      },
      required: ['email', 'password', 'role'],
    },
  },
  required: ['aggregateId', 'data'],
};

// Register the schema with the central registry.
// In a real application, this might happen at application startup.
schemaRegistry.register(SCHEMA_NAME, v1);

module.exports = {
  SCHEMA_NAME,
  v1,
};
