const { parseCsv } = require('../src/csv_parser');

describe('parseCsv', () => {
  test('should parse a simple CSV', () => {
    const csv = 'a,b,c\n1,2,3';
    expect(parseCsv(csv)).toEqual([['a', 'b', 'c'], ['1', '2', '3']]);
  });

  test('should handle quoted fields with commas', () => {
    const csv = 'a,"b,c",d\n1,"2,3",4';
    const expected = [['a', 'b,c', 'd'], ['1', '2,3', '4']];
    expect(parseCsv(csv)).toEqual(expected);
  });

  test('should handle quoted fields with newlines', () => {
    const csv = 'a,"b\nc",d\n1,"2\n3",4';
    const expected = [['a', 'b\nc', 'd'], ['1', '2\n3', '4']];
    expect(parseCsv(csv)).toEqual(expected);
  });

  test('should handle escaped quotes within quoted fields', () => {
    const csv = 'a,"b""c",d';
    const expected = [['a', 'b"c', 'd']];
    expect(parseCsv(csv)).toEqual(expected);
  });

  test('should handle a complex CSV with mixed quoting', () => {
    const csv = 'a,"b,c",d\n1,"2\\n3","4""5"';
    const expected = [['a', 'b,c', 'd'], ['1', '2\\n3', '4"5']];
    expect(parseCsv(csv)).toEqual(expected);
  });

  test('should handle empty fields', () => {
    const csv = 'a,,c\n1,,3';
    expect(parseCsv(csv)).toEqual([['a', '', 'c'], ['1', '', '3']]);
  });
});
