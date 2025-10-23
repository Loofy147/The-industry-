/**
 * Validates and cleans a dataset based on a provided schema.
 * This function enforces a data contract, making AI pipelines more robust.
 *
 * @param {Array<Object>} data An array of data records (objects).
 * @param {Object} schema An object defining the validation and cleaning rules for each key.
 * @returns {Array<Object>} A new array with the cleaned data.
 */
function validateAndClean(data, schema) {
  // Return a new array; do not mutate the original data.
  return data.map(record => {
    const cleanedRecord = { ...record };

    for (const key in schema) {
      if (Object.hasOwnProperty.call(schema, key)) {
        const rules = schema[key];
        let value = cleanedRecord[key];

        // 1. Handle missing data by applying the default value.
        if (value === null || value === undefined) {
          value = rules.defaultValue;
        }

        // 2. Enforce the correct data type.
        if (rules.type === 'number') {
          const numericValue = Number(value);
          // If coercion results in NaN (e.g., from an invalid string), use the default value.
          value = isNaN(numericValue) ? rules.defaultValue : numericValue;
        } else if (rules.type === 'string') {
          value = String(value);
        }
        // Additional types like 'boolean' could be added here.

        // 3. Clamp outliers to the specified min/max range (for numbers only).
        if (rules.type === 'number' && rules.clamp) {
          if (rules.clamp.min !== undefined && value < rules.clamp.min) {
            value = rules.clamp.min;
          }
          if (rules.clamp.max !== undefined && value > rules.clamp.max) {
            value = rules.clamp.max;
          }
        }

        cleanedRecord[key] = value;
      }
    }
    return cleanedRecord;
  });
}

module.exports = { validateAndClean };
