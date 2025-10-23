const { validateIban } = require('./iban_validator');

describe('validateIban', () => {
  test('should return true for a valid IBAN', () => {
    // A valid German IBAN
    expect(validateIban('DE89370400440532013000')).toBe(true);
  });

  test('should return false for an invalid IBAN with an incorrect checksum', () => {
    // An invalid German IBAN (checksum is incorrect)
    expect(validateIban('DE89370400440532013001')).toBe(false);
  });

  test('should return false for an IBAN with an incorrect length', () => {
    // An invalid German IBAN (length is incorrect)
    expect(validateIban('DE8937040044053201300')).toBe(false);
  });

  test('should return false for an IBAN with an invalid country code', () => {
    // An IBAN with a non-existent country code
    expect(validateIban('XX89370400440532013000')).toBe(false);
  });

  test('should return true for a valid IBAN with spaces', () => {
    // A valid German IBAN with spaces
    expect(validateIban('DE89 3704 0044 0532 0130 00')).toBe(true);
  });

  test('should return false for an empty string', () => {
    expect(validateIban('')).toBe(false);
  });
});
