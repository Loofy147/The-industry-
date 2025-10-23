const { TightlyCoupledReportGenerator } = require('../src/tightly_coupled_report_generator');
const { DecoupledReportGenerator } = require('../src/decoupled_report_generator');

describe('Dependency Inversion Principle Refactor', () => {

  // This demonstrates the "multi-gap" problem: the module is rigid and untestable.
  describe('TightlyCoupledReportGenerator (Violates DIP)', () => {
    test('is impossible to unit test in isolation', () => {
      // How can we test the report formatting logic without running the REAL database query?
      // We can't. The test is completely coupled to the `MySqlDatabase` implementation.
      // If the database is down, this test fails, even if the report logic is correct.
      // This violates the core principles of unit testing.

      const reportGenerator = new TightlyCoupledReportGenerator();
      const report = reportGenerator.generateSalesReport();

      // We are forced to make assertions against the hard-coded data from the real database.
      expect(report).toContain('Laptop: 150');
      expect(report).toContain('Mouse: 200');
    });
  });

  // This demonstrates the "shared solution": a flexible and testable module that adheres to DIP.
  describe('DecoupledReportGenerator (Adheres to DIP)', () => {
    test('allows for easy unit testing with mock dependencies', () => {
      // SOLUTION: We can "inject" a fake (mock) database object that conforms to the
      // required abstraction (it has a `query` method).
      const mockDatabase = {
        query: jest.fn().mockReturnValue([
          { item: 'Keyboard', sales: 50 },
          { item: 'Monitor', sales: 120 },
        ]),
      };

      // We also inject a mock logger.
      const mockLogger = {
        log: jest.fn(),
      };

      // The high-level module is now completely decoupled from the implementation details.
      const reportGenerator = new DecoupledReportGenerator(mockDatabase, mockLogger);
      const report = reportGenerator.generateSalesReport();

      // We can now test the business logic in complete isolation.
      expect(mockDatabase.query).toHaveBeenCalledWith('SELECT * FROM sales');
      expect(mockLogger.log).toHaveBeenCalledWith('Starting sales report generation...');
      expect(mockLogger.log).toHaveBeenCalledWith('Sales report generation complete.');

      // The test is now robust and tests the logic, not the data.
      expect(report).toContain('Keyboard: 50');
      expect(report).toContain('Monitor: 120');
      expect(report).not.toContain('Laptop'); // Verifies we're using the mock data.
    });
  });
});
