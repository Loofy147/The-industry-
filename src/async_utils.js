/**
 * Executes an array of promise-returning functions with a specified concurrency limit.
 * This prevents resource exhaustion and ensures optimal parallelism.
 *
 * @param {Array<Function>} taskFunctions An array of functions that each return a promise.
 * @param {number} limit The maximum number of tasks to run concurrently.
 * @returns {Promise<Array>} A promise that resolves with an array of the results of all tasks.
 */
function throttle(taskFunctions, limit) {
  return new Promise((resolve, reject) => {
    const results = new Array(taskFunctions.length);
    let completed = 0;
    let running = 0;
    let taskIndex = 0;

    function runNext() {
      if (completed === taskFunctions.length) {
        resolve(results);
        return;
      }

      while (running < limit && taskIndex < taskFunctions.length) {
        const currentIndex = taskIndex;
        running++;
        taskIndex++;

        taskFunctions[currentIndex]()
          .then(result => {
            results[currentIndex] = result;
          })
          .catch(error => {
            // If one promise rejects, reject the whole throttle operation.
            reject(error);
          })
          .finally(() => {
            running--;
            completed++;
            runNext();
          });
      }
    }

    runNext();
  });
}

/**
 * Wraps an asynchronous function, caching its result based on its arguments.
 * Crucially, it caches the promise itself, preventing race conditions where the same
 * async function is called multiple times concurrently with the same arguments.
 *
 * @param {Function} asyncFn The asynchronous function to memoize.
 * @returns {Function} The memoized version of the function.
 */
function memoizeAsync(asyncFn) {
  const cache = new Map();

  return async function(...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const promise = asyncFn(...args);
    cache.set(key, promise);

    // If the promise rejects, remove it from the cache so that subsequent calls can retry.
    promise.catch(() => {
      if (cache.get(key) === promise) {
        cache.delete(key);
      }
    });

    return promise;
  };
}

module.exports = { throttle, memoizeAsync };