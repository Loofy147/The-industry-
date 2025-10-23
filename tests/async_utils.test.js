const { throttle, memoizeAsync } = require('../src/async_utils');

// A helper function to create a delayed promise
const delay = (ms, value) => new Promise(resolve => setTimeout(() => resolve(value), ms));

describe('Async Control Flow Utilities', () => {
  describe('throttle', () => {
    test('should run tasks with a specified concurrency limit', async () => {
      let running = 0;
      let maxRunning = 0;

      const tasks = Array(10).fill(null).map(() => async () => {
        running++;
        maxRunning = Math.max(maxRunning, running);
        await delay(50);
        running--;
        return 1;
      });

      const results = await throttle(tasks, 3);

      expect(maxRunning).toBe(3);
      expect(results.length).toBe(10);
      expect(results.every(r => r === 1)).toBe(true);
    });

    test('should handle an empty array of tasks', async () => {
      const results = await throttle([], 3);
      expect(results).toEqual([]);
    });

    test('should reject if any task rejects', async () => {
      const tasks = [
        () => delay(10, 'ok'),
        () => Promise.reject(new Error('failed')),
        () => delay(20, 'ok'),
      ];

      await expect(throttle(tasks, 2)).rejects.toThrow('failed');
    });
  });

  describe('memoizeAsync', () => {
    test('should only execute the underlying function once for concurrent calls with the same arguments', async () => {
      let callCount = 0;
      const slowFunction = async (arg) => {
        callCount++;
        await delay(100);
        return `result for ${arg}`;
      };

      const memoized = memoizeAsync(slowFunction);

      // Call the memoized function multiple times concurrently with the same argument
      const promises = [
        memoized('A'),
        memoized('A'),
        memoized('A'),
      ];

      const results = await Promise.all(promises);

      // The underlying function should have only been called once
      expect(callCount).toBe(1);

      // All results should be the same
      expect(results).toEqual([
        'result for A',
        'result for A',
        'result for A',
      ]);
    });

    test('should call the function again for different arguments', async () => {
      let callCount = 0;
      const slowFunction = async (arg1, arg2) => {
        callCount++;
        await delay(50);
        return `result for ${arg1}, ${arg2}`;
      };

      const memoized = memoizeAsync(slowFunction);

      await memoized('A', 1);
      await memoized('B', 2);

      expect(callCount).toBe(2);
    });

    test('should retry the function if the previous call rejected', async () => {
      let shouldFail = true;
      let callCount = 0;
      const fallibleFunction = async () => {
        callCount++;
        await delay(50);
        if (shouldFail) {
          shouldFail = false;
          throw new Error('failed');
        }
        return 'success';
      };

      const memoized = memoizeAsync(fallibleFunction);

      // First call should fail
      await expect(memoized()).rejects.toThrow('failed');
      expect(callCount).toBe(1);

      // Second call should succeed
      const result = await memoized();
      expect(result).toBe('success');
      expect(callCount).toBe(2);
    });
  });
});