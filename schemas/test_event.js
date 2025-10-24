const { schemaRegistry } = require('../src/schema_registry');

const testEventSchema = {
  $id: 'TestEvent',
  type: 'object',
  properties: {
    aggregateId: { type: 'string' },
    type: { type: 'string' },
    data: {
      type: 'object',
      properties: {
        foo: { type: 'string' }
      },
      required: ['foo']
    }
  },
  required: ['aggregateId', 'type', 'data']
};

schemaRegistry.register('TestEvent', testEventSchema);
