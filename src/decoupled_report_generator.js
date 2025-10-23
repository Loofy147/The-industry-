/**
 * This module represents the "shared solution" - adherence to the Dependency Inversion Principle.
 * The high-level module, `DecoupledReportGenerator`, depends on abstractions, not on
 * concrete low-level modules. The dependencies are "injected" from the outside.
 *
 * This creates a flexible, modular, and highly testable architecture.
 */

// --- High-Level Module (Business Logic) ---

class DecoupledReportGenerator {
  constructor(database, logger) {
    // SOLUTION: The dependencies are injected.
    // The high-level module does not control the creation of its dependencies.
    // It depends on the abstractions (any object with a `query` or `log` method).
    this.database = database;
    this.logger = logger;
  }

  generateSalesReport() {
    this.logger.log('Starting sales report generation...');
    const data = this.database.query('SELECT * FROM sales');

    // The same complex business logic
    const report = `Sales Report:\n` + data.map(d => `${d.item}: ${d.sales}`).join('\n');

    this.logger.log('Sales report generation complete.');
    return report;
  }
}

// --- Low-Level Modules (Implementation Details) ---
// These are the same as before, but now they are used to *compose* the application
// at the highest level, rather than being hard-coded dependencies.

class MySqlDatabase {
  query(sql) {
    console.log(`(MySQL) Executing query: ${sql}`);
    return [{ item: 'Laptop', sales: 150 }, { item: 'Mouse', sales: 200 }];
  }
}

class FileSystemLogger {
  log(message) {
    console.log(`(File) Logging: ${message}`);
  }
}

// Another concrete implementation for the logger abstraction.
class CloudLogger {
  log(message) {
    console.log(`(Cloud) Logging: ${message}`);
  }
}

module.exports = {
  DecoupledReportGenerator,
  MySqlDatabase,      // Exporting for composition
  FileSystemLogger,   // Exporting for composition
  CloudLogger         // Exporting for composition
};
