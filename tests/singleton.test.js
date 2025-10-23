const { FlawedSingleton, SecureSingleton } = require('../src/singleton');

describe('Singleton Pattern', () => {
  describe('FlawedSingleton', () => {
    test('should create multiple instances under concurrent requests', async () => {
      // Reset the static instance for a clean test
      FlawedSingleton.instance = null;

      const promises = Array(10).fill(null).map(() => FlawedSingleton.getInstance());
      const instances = await Promise.all(promises);

      // Check if all instances are the same
      const firstInstance = instances[0];
      const allSame = instances.every(instance => instance === firstInstance);

      // This will fail because multiple instances are created
      expect(allSame).toBe(false);

      // To be more explicit, let's count the unique instances
      const uniqueInstances = new Set(instances);
      expect(uniqueInstances.size).toBeGreaterThan(1);
    });
  });

  describe('SecureSingleton', () => {
    test('should create only one instance under concurrent requests', async () => {
      // Reset the static promise and instance for a clean test
      SecureSingleton.promise = null;
      SecureSingleton.instance = null;

      const promises = Array(10).fill(null).map(() => SecureSingleton.getInstance());
      const instances = await Promise.all(promises);

      // Check if all instances are the same
      const firstInstance = instances[0];
      const allSame = instances.every(instance => instance === firstInstance);

      // This will pass because only one instance is created
      expect(allSame).toBe(true);

      const uniqueInstances = new Set(instances);
      expect(uniqueInstances.size).toBe(1);
    });
  });
});
