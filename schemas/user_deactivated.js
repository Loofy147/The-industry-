const { schemaRegistry } = require('../src/schema_registry');

const SCHEMA_NAME = 'UserDeactivated';

// Version 1 of the UserDeactivated event schema.
const v1 = {
  type: 'object',
  properties: {
    aggregateId: { type: 'string', format: 'uuid' },
    // The data payload for this event is empty, but we define it for consistency.
    data: {
      type: 'object',
      properties: {},
    },
  },
  required: ['aggregateId', 'data'],
};

// Register the schema with the central registry.
schemaRegistry.register(SCHEMA_NAME, v1);

module.exports = {
  SCHEMA_NAME,
  v1,
};
