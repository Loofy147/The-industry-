const { validateAndClean } = require('../src/data_validator');

describe('AI Data Validator and Cleaner', () => {
  const schema = {
    age: { type: 'number', defaultValue: 25, clamp: { min: 18, max: 100 } },
    score: { type: 'number', defaultValue: 50, clamp: { min: 0, max: 100 } },
    status: { type: 'string', defaultValue: 'unknown' },
  };

  // Test for Gap 1: Data Type Inconsistency
  test('should correct inconsistent data types', () => {
    const dirtyData = [
      { age: '30', score: '85.5' },
      { age: 25, score: 'invalid' }, // 'invalid' should become the default value
    ];
    const cleanedData = validateAndClean(dirtyData, schema);

    expect(cleanedData[0].age).toBe(30);
    expect(cleanedData[0].score).toBe(85.5);
    expect(cleanedData[1].age).toBe(25);
    expect(cleanedData[1].score).toBe(schema.score.defaultValue);
  });

  // Test for Gap 2: Silent Handling of Missing Data
  test('should fill in missing values with defaults', () => {
    const dirtyData = [
      { age: 45, score: 90 },
      { age: null, score: 75 },
      { age: 35, score: undefined },
    ];
    const cleanedData = validateAndClean(dirtyData, schema);

    expect(cleanedData[0].age).toBe(45);
    expect(cleanedData[1].age).toBe(schema.age.defaultValue);
    expect(cleanedData[2].score).toBe(schema.score.defaultValue);
  });

  // Test for Gap 3: Outlier-Driven Prediction Errors
  test('should clamp outliers to the specified range', () => {
    const dirtyData = [
      { age: 50, score: 50 },
      { age: 999, score: -10 }, // age is too high, score is too low
      { age: 10, score: 110 },  // age is too low, score is too high
    ];
    const cleanedData = validateAndClean(dirtyData, schema);

    expect(cleanedData[1].age).toBe(schema.age.clamp.max);
    expect(cleanedData[1].score).toBe(schema.score.clamp.min);
    expect(cleanedData[2].age).toBe(schema.age.clamp.min);
    expect(cleanedData[2].score).toBe(schema.score.clamp.max);
  });

  // Comprehensive test to show all rules working together
  test('should handle a mix of all data issues simultaneously', () => {
    const dirtyData = [
      { age: '42', score: 95.5, status: 'active' }, // Clean case
      { age: null, score: 'invalid', status: 123 }, // Missing age, invalid score, wrong status type
      { age: 1000, score: undefined, status: null }, // Outlier age, missing score and status
      { age: '17', score: -50, status: 'inactive' }, // Outlier age and score (coerced)
    ];

    const cleanedData = validateAndClean(dirtyData, schema);

    // Expected results
    const expected = [
      { age: 42, score: 95.5, status: 'active' },
      { age: 25, score: 50, status: '123' }, // Defaults and type coercion
      { age: 100, score: 50, status: 'unknown' }, // Clamping and defaults
      { age: 18, score: 0, status: 'inactive' }, // Clamping after coercion
    ];

    expect(cleanedData).toEqual(expected);
  });

  test('should not mutate the original data array', () => {
    const originalData = [{ age: '30' }];
    const originalDataCopy = JSON.parse(JSON.stringify(originalData));

    validateAndClean(originalData, schema);

    // Check that the original data object is unchanged
    expect(originalData).toEqual(originalDataCopy);
  });
});