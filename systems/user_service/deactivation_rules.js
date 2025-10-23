/**
 * A declarative rule set for user deactivation.
 * These rules are treated as data by the RulesEngine.
 */
const deactivationRules = [
  {
    // A descriptive name for the rule.
    name: 'AdminDeactivationNotAllowed',
    // The condition that triggers this rule.
    condition: {
      fact: 'user.role',
      operator: 'equals',
      value: 'admin',
    },
    // The action to take if the condition is met.
    action: {
      outcome: 'deny',
      reason: 'Administrative users cannot be deactivated.',
    },
  },
  // We could add more rules here, e.g.:
  // {
  //   name: 'UserWithPendingOrdersCannotBeDeactivated',
  //   condition: { ... },
  //   action: { outcome: 'deny', reason: 'User has pending orders.' }
  // }
];

module.exports = { deactivationRules };
