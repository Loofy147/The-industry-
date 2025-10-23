const { RulesEngine } = require('../src/rules_engine');
const { deactivationRules } = require('../systems/user_service/deactivation_rules');
const { UserLogic } = require('../systems/user_service/user_logic');
const { MessageBus } = require('../src/message_bus');
const { UserRepository } = require('../src/user_repository');
const { EventStore } = require('../src/event_store');

describe('Business Rules Engine Integration', () => {

  describe('Generic RulesEngine', () => {
    it('should deny an action when a rule condition is met', () => {
      const engine = new RulesEngine(deactivationRules);
      const facts = { user: { role: 'admin' } };
      const result = engine.evaluate(facts);
      expect(result.outcome).toBe('deny');
      expect(result.reason).toBe('Administrative users cannot be deactivated.');
    });

    it('should allow an action when no rule condition is met', () => {
      const engine = new RulesEngine(deactivationRules);
      const facts = { user: { role: 'customer' } };
      const result = engine.evaluate(facts);
      expect(result.outcome).toBe('allow');
    });
  });

  describe('UserLogic with Rules Engine', () => {
    let userLogic;
    let messageBus;
    let eventStore;

    beforeEach(() => {
      messageBus = new MessageBus();
      eventStore = new EventStore(messageBus);
      const userRepository = new UserRepository(eventStore);
      userLogic = new UserLogic(userRepository, messageBus);
      // This is the crucial step: the event store must listen to the bus.
      eventStore.subscribeToAllEvents();
    });

    it('should block deactivation of an admin user', async () => {
      const adminUserId = await userLogic.registerUser('admin@example.com', 'password123', 'admin');
      await expect(userLogic.deactivateUser(adminUserId))
        .rejects.toThrow('Administrative users cannot be deactivated.');
    });

    it('should allow deactivation of a non-admin user', async () => {
      const customerUserId = await userLogic.registerUser('customer@example.com', 'password123', 'customer');
      const publishSpy = jest.spyOn(messageBus, 'publish');

      await userLogic.deactivateUser(customerUserId);

      const [topic, event] = publishSpy.mock.calls.find(call => call[0] === 'UserDeactivated');
      expect(topic).toBe('UserDeactivated');
      expect(event.aggregateId).toBe(customerUserId);
    });
  });
});
