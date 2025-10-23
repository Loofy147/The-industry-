/**
 * A simple, generic, data-driven Business Rules Engine.
 */
class RulesEngine {
  constructor(rules) {
    this.rules = rules || [];
  }

  /**
   * Evaluates a set of facts against the defined rules.
   * @param {object} facts An object containing the data to be evaluated.
   * @returns {object} A result object, e.g., { outcome: 'allow' } or { outcome: 'deny', reason: '...' }.
   */
  evaluate(facts) {
    for (const rule of this.rules) {
      if (this._matches(rule.condition, facts)) {
        // The first rule that matches determines the outcome.
        return rule.action;
      }
    }
    // If no rules match, a default outcome is returned.
    return { outcome: 'allow' };
  }

  /**
   * A simple matcher that checks if a condition is met by the facts.
   * This could be extended to support more complex operators (e.g., 'greaterThan', 'contains').
   * @private
   */
  _matches(condition, facts) {
    const factValue = this._getFactValue(condition.fact, facts);
    switch (condition.operator) {
      case 'equals':
        return factValue === condition.value;
      case 'notEquals':
        return factValue !== condition.value;
      default:
        return false;
    }
  }

  /**
   * A helper to retrieve a potentially nested fact value.
   * e.g., 'user.role' -> facts['user']['role']
   * @private
   */
  _getFactValue(factPath, facts) {
    return factPath.split('.').reduce((obj, key) => (obj && obj[key] !== 'undefined') ? obj[key] : undefined, facts);
  }
}

module.exports = { RulesEngine };
