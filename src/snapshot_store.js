const { FileDatabase } = require('./file_database');

/**
 * A persistence service for storing and retrieving aggregate state snapshots.
 * This is a key performance optimization for event-sourced systems.
 */
class SnapshotStore {
  /**
   * Creates a new SnapshotStore instance.
   * @param {string} [dbPath='db/snapshot_store.json'] The path to the database file.
   */
  constructor(dbPath = 'db/snapshot_store.json') {
    this.db = new FileDatabase(dbPath);
  }

  /**
   * Saves a snapshot of an aggregate's state.
   * @param {string} aggregateId The ID of the aggregate.
   * @param {object} snapshot The snapshot data, including state and version.
   */
  save(aggregateId, snapshot) {
    this.db.set(aggregateId, snapshot);
    console.log(`SnapshotStore: Saved snapshot for aggregate ${aggregateId} at version ${snapshot.version}.`);
  }

  /**
   * Retrieves the latest snapshot for a given aggregate.
   * @param {string} aggregateId The ID of the aggregate.
   * @returns {object|undefined} The latest snapshot or undefined if none exists.
   */
  get(aggregateId) {
    return this.db.get(aggregateId);
  }
}

const snapshotStore = new SnapshotStore();

module.exports = { SnapshotStore, snapshotStore };
