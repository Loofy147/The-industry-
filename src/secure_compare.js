const crypto = require('crypto');

/**
 * Compares two strings in constant time to prevent timing attacks.
 *
 * @param {string} a The first string.
 * @param {string} b The second string.
 * @returns {boolean} True if the strings are equal, false otherwise.
 */
function constantTimeEquals(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  const len = Math.max(a.length, b.length);
  const bufA = Buffer.alloc(len, 0);
  const bufB = Buffer.alloc(len, 0);
  bufA.write(a);
  bufB.write(b);

  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = { constantTimeEquals };
