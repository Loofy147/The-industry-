const { constantTimeEquals } = require('../src/secure_compare');

describe('constantTimeEquals', () => {
  test('should return true for equal strings', () => {
    expect(constantTimeEquals('password', 'password')).toBe(true);
  });

  test('should return false for unequal strings', () => {
    expect(constantTimeEquals('password', 'passw0rd')).toBe(false);
  });

  test('should return false for strings of different lengths', () => {
    expect(constantTimeEquals('password', 'password123')).toBe(false);
  });

  test('should return false for non-string inputs', () => {
    expect(constantTimeEquals('password', 123)).toBe(false);
    expect(constantTimeEquals(null, 'password')).toBe(false);
    expect(constantTimeEquals(undefined, undefined)).toBe(false);
  });

  test('should return true for empty strings', () => {
    expect(constantTimeEquals('', '')).toBe(true);
  });
});
