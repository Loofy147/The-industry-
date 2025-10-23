/**
 * This module represents a common violation of the Dependency Inversion Principle.
 * The high-level module, `TightlyCoupledReportGenerator`, depends directly on low-level
 * modules (`MySqlDatabase`, `FileSystemLogger`).
 *
 * This creates a rigid and untestable architecture.
 */

// --- Low-Level Modules (Implementation Details) ---

class MySqlDatabase {
  // A concrete implementation for a MySQL database.
  query(sql) {
    console.log(`(MySQL) Executing query: ${sql}`);
    // In a real app, this would return actual data.
    return [{ item: 'Laptop', sales: 150 }, { item: 'Mouse', sales: 200 }];
  }
}

class FileSystemLogger {
  // A concrete implementation for a logger that writes to a file.
  log(message) {
    console.log(`(File) Logging: ${message}`);
  }
}

// --- High-Level Module (Business Logic) ---

class TightlyCoupledReportGenerator {
  constructor() {
    // VIOLATION: The high-level module creates its own low-level dependencies.
    // This hard-codes the dependency on `MySqlDatabase` and `FileSystemLogger`.
    this.database = new MySqlDatabase();
    this.logger = new FileSystemLogger();
  }

  generateSalesReport() {
    this.logger.log('Starting sales report generation...');
    const data = this.database.query('SELECT * FROM sales');

    // Some complex business logic to format the report
    const report = `Sales Report:\n` + data.map(d => `${d.item}: ${d.sales}`).join('\n');

    this.logger.log('Sales report generation complete.');
    return report;
  }
}

module.exports = { TightlyCoupledReportGenerator, MySqlDatabase, FileSystemLogger };
