const { factorial } = require('./calculator');

describe('factorial', () => {
  // Test cases for integer inputs
  test('should return 1 for factorial of 0', () => {
    expect(factorial(0)).toBe(1);
  });

  test('should return 1 for factorial of 1', () => {
    expect(factorial(1)).toBe(1);
  });

  test('should return 120 for factorial of 5', () => {
    expect(factorial(5)).toBe(120);
  });

  // Test case for a non-integer input
  test('should return the correct value for a non-integer', () => {
    // This test will fail before the fix and pass after
    // The expected value is Γ(4.5 + 1) = 52.34277778
    expect(factorial(4.5)).toBeCloseTo(52.34277778);
  });

  // Test case for a negative input
  test('should return NaN for negative numbers', () => {
    expect(factorial(-1)).toBeNaN();
  });
});
