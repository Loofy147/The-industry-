const fs = require('fs');
const path = require('path');

/**
 * A simple file-based database for persisting data to disk.
 */
class FileDatabase {
  /**
   * Creates a new FileDatabase instance.
   * @param {string} filePath The path to the database file.
   */
  constructor(filePath) {
    this.filePath = filePath;
    this.data = this.load();
  }

  /**
   * Loads the database from disk.
   * @returns {object} The database content.
   */
  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, 'utf-8');
        return JSON.parse(fileContent);
      }
      return {};
    } catch (error) {
      console.error('Error loading database file:', error);
      return {};
    }
  }

  /**
   * Saves the database to disk.
   */
  save() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving database file:', error);
    }
  }

  /**
   * Gets a value from the database.
   * @param {string} key The key to retrieve.
   * @returns {*} The value associated with the key.
   */
  get(key) {
    return this.data[key];
  }

  /**
   * Sets a value in the database.
   * @param {string} key The key to set.
   * @param {*} value The value to set.
   */
  set(key, value) {
    this.data[key] = value;
    this.save();
  }

  /**
   * Clears the database.
   */
  clear() {
    this.data = {};
    this.save();
  }
}

module.exports = { FileDatabase };
