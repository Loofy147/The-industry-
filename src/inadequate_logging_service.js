/**
 * This module represents a service with inadequate, unstructured logging.
 * It uses simple `console.log` statements, which lack structure and context.
 *
 * In a real production system, debugging an issue with this service would be
 * extremely difficult.
 */

class InadequateLoggingService {
  processUserData(userId) {
    console.log(`Starting to process user data for user ID: ${userId}`);

    // Simulate some business logic
    if (userId < 0) {
      console.log(`Error: Invalid user ID provided: ${userId}`);
      return { success: false, message: 'Invalid user ID' };
    }

    // Simulate a database call
    console.log(`Fetching data for user ${userId} from the database...`);
    const data = { id: userId, name: 'John Doe' };
    console.log('...Data fetched successfully.');

    // Simulate another action
    console.log(`Enriching data for user ${userId}...`);
    const enrichedData = { ...data, enriched: true };
    console.log('...Enrichment complete.');

    console.log(`Finished processing user data for user ID: ${userId}`);
    return { success: true, data: enrichedData };
  }
}

module.exports = { InadequateLoggingService };
