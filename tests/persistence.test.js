const fs = require('fs');
const path = require('path');
const { FileDatabase } = require('../src/file_database');
const { EventStore } = require('../src/event_store');
const { MessageBus } = require('../src/message_bus');
require('../schemas/test_event');

describe('Persistence Layer', () => {
  const dbPath = path.join(__dirname, 'test_db.json');
  let db;

  beforeEach(() => {
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
    db = new FileDatabase(dbPath);
  });

  afterEach(() => {
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  });

  it('should save and load data from the file database', () => {
    db.set('testKey', 'testValue');
    const newDb = new FileDatabase(dbPath);
    expect(newDb.get('testKey')).toBe('testValue');
  });

  it('should persist events in the event store', () => {
    const messageBus = new MessageBus();
    const eventStore = new EventStore(messageBus, dbPath);
    eventStore.subscribeToAllEvents();

    const testEvent = {
      type: 'TestEvent',
      aggregateId: 'testAggregate',
      data: {
        foo: 'bar'
      },
    };
    messageBus.publish('TestEvent', testEvent);

    const newEventStore = new EventStore(new MessageBus(), dbPath);
    const events = newEventStore.readStream('testAggregate');
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(testEvent);
  });
});
