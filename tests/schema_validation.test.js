const { MessageBus } = require('../src/message_bus');
const { schemaRegistry } = require('../src/schema_registry');
const { v4: uuidv4 } = require('uuid');

describe('Schema Validation in Message Bus', () => {
  let messageBus;
  let handlerSpy;

  beforeEach(() => {
    messageBus = new MessageBus();
    handlerSpy = jest.fn();
  });

  it('should process a valid event that conforms to the schema', () => {
    // Arrange: Subscribe a handler for the UserRegistered event.
    messageBus.subscribe('UserRegistered', handlerSpy, 1);

    const validEvent = {
      aggregateId: uuidv4(),
      data: {
        email: 'test@example.com',
        password: 'password123',
        role: 'customer',
      },
    };

    // Act: Publish the valid event.
    messageBus.publish('UserRegistered', validEvent);

    // Assert: The handler should have been called.
    expect(handlerSpy).toHaveBeenCalledWith(validEvent);
    expect(messageBus.deadLetterQueue).toHaveLength(0);
  });

  it('should reject an invalid event and move it to the dead-letter queue', () => {
    // Arrange: Subscribe a handler.
    messageBus.subscribe('UserRegistered', handlerSpy, 1);

    const invalidEvent = {
      aggregateId: uuidv4(),
      data: {
        // Missing the required 'email' field.
        password: 'password123',
        role: 'customer',
      },
    };

    // Act: Publish the invalid event.
    messageBus.publish('UserRegistered', invalidEvent);

    // Assert: The handler should NOT have been called.
    expect(handlerSpy).not.toHaveBeenCalled();
    // The invalid message should be in the DLQ.
    expect(messageBus.deadLetterQueue).toHaveLength(1);
    expect(messageBus.deadLetterQueue[0].errors[0].message).toBe("must have required property 'email'");
  });

  it('should support backward-compatible schema evolution (new optional field)', () => {
    // Arrange:
    // Define and register a new version of the schema with an optional field.
    const v2Schema = {
      ...schemaRegistry.getSchema('UserRegistered', 1), // Copy v1
      properties: {
        ...schemaRegistry.getSchema('UserRegistered', 1).properties,
        data: {
          ...schemaRegistry.getSchema('UserRegistered', 1).properties.data,
          properties: {
            ...schemaRegistry.getSchema('UserRegistered', 1).properties.data.properties,
            displayName: { type: 'string' }, // Add a new, optional field
          },
        },
      },
    };
    schemaRegistry.register('UserRegistered', v2Schema);

    // An old consumer that only understands v1.
    const oldConsumerSpy = jest.fn();
    messageBus.subscribe('UserRegistered', oldConsumerSpy, 1);

    // A new consumer that understands v2.
    const newConsumerSpy = jest.fn();
    messageBus.subscribe('UserRegistered', newConsumerSpy, 2);


    const newEvent = {
      aggregateId: uuidv4(),
      data: {
        email: 'new-user@example.com',
        password: 'password123',
        role: 'customer',
        displayName: 'New User', // The new event includes the new field.
      },
    };

    // Act: Publish the new event.
    messageBus.publish('UserRegistered', newEvent);

    // Assert:
    // Both consumers should have successfully processed the event, because
    // the new field was optional, making the change backward-compatible.
    expect(oldConsumerSpy).toHaveBeenCalledWith(newEvent);
    expect(newConsumerSpy).toHaveBeenCalledWith(newEvent);
    expect(messageBus.deadLetterQueue).toHaveLength(0);
  });
});
