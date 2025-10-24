/**
 * Parses a CSV string into a two-dimensional array.
 *
 * @param {string} csv The CSV string to parse.
 * @returns {Array<Array<string>>} A two-dimensional array representing the CSV data.
 */
function parseCsv(csv) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotedField = false;
  let i = 0;

  while (i < csv.length) {
    const char = csv[i];

    if (inQuotedField) {
      if (char === '"') {
        if (i + 1 < csv.length && csv[i + 1] === '"') {
          // Escaped quote
          currentField += '"';
          i++;
        } else {
          // End of quoted field
          inQuotedField = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotedField = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\n' || char === '\r') {
        if (i > 0 && csv[i - 1] !== '\n' && csv[i - 1] !== '\r') {
          currentRow.push(currentField);
          rows.push(currentRow);
          currentRow = [];
          currentField = '';
        }
        if (char === '\r' && i + 1 < csv.length && csv[i + 1] === '\n') {
          i++; // Handle CRLF
        }
      } else {
        currentField += char;
      }
    }
    i++;
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

module.exports = { parseCsv };