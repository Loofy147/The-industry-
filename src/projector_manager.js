/**
 * Manages all projectors in the system, making them discoverable and replayable.
 */
class ProjectorManager {
  constructor(eventStore) {
    this.eventStore = eventStore;
    this.projectors = new Map();
  }

  /**
   * Registers a new projector.
   * @param {string} name A unique name for the projector (e.g., 'UserReadModel').
   * @param {object} projector The projector instance. It must have a `project` and `clear` method.
   */
  register(name, projector) {
    if (this.projectors.has(name)) {
      console.warn(`ProjectorManager: A projector with the name "${name}" is already registered. Overwriting.`);
    }
    this.projectors.set(name, projector);
  }

  /**
   * Triggers a replay for a specific projector.
   * This involves clearing the projector's state and re-projecting all events.
   * @param {string} name The name of the projector to replay.
   */
  replay(name) {
    return new Promise((resolve, reject) => {
      const projector = this.projectors.get(name);
      if (!projector) {
        return reject(new Error(`Projector "${name}" not found.`));
      }

      console.log(`ProjectorManager: Starting replay for projector "${name}"...`);

      // 1. Clear the projector's current state
      if (typeof projector.clear !== 'function') {
        return reject(new Error(`Projector "${name}" does not have a 'clear' method.`));
      }
      projector.clear();

      // 2. Re-apply all historical events
      if (typeof projector.project !== 'function') {
        return reject(new Error(`Projector "${name}" does not have a 'project' method.`));
      }
      projector.project(this.eventStore.readAllEvents());

      console.log(`ProjectorManager: Replay completed for projector "${name}".`);
      resolve();
    });
  }
}

module.exports = { ProjectorManager };
