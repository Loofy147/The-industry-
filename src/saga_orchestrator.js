/**
 * A simple saga orchestrator for managing distributed transactions.
 */
class SagaOrchestrator {
  /**
   * Creates a new SagaOrchestrator instance.
   */
  constructor() {
    this.sagas = {};
  }

  /**
   * Defines a new saga.
   * @param {string} sagaName The name of the saga.
   * @param {Array<object>} steps The steps of the saga.
   */
  define(sagaName, steps) {
    this.sagas[sagaName] = {
      name: sagaName,
      steps: steps,
    };
  }

  /**
   * Executes a saga.
   * @param {string} sagaName The name of the saga to execute.
   * @param {object} initialContext The initial context for the saga.
   * @returns {Promise<object>} A promise that resolves with the final context.
   */
  async execute(sagaName, initialContext = {}) {
    const saga = this.sagas[sagaName];
    if (!saga) {
      throw new Error(`Saga "${sagaName}" is not defined.`);
    }

    const executedSteps = [];
    let context = { ...initialContext };

    for (const step of saga.steps) {
      try {
        console.log(`Executing step: ${step.name}`);
        context = await step.action(context);
        executedSteps.push(step);
      } catch (error) {
        console.error(`Error in step ${step.name}:`, error.message);
        await this.compensate(executedSteps, context);
        throw new Error(`Saga "${sagaName}" failed and was rolled back.`);
      }
    }

    console.log(`Saga "${sagaName}" completed successfully.`);
    return context;
  }

  async compensate(executedSteps, context) {
    console.log('Starting compensation...');
    const reversedSteps = [...executedSteps].reverse();
    for (const step of reversedSteps) {
      if (step.compensation) {
        try {
          console.log(`Compensating for step: ${step.name}`);
          await step.compensation(context);
        } catch (compensationError) {
          console.error(`FATAL: Compensation for step ${step.name} failed:`, compensationError.message);
          // In a real-world scenario, this would require manual intervention.
          // For now, we log it as a critical failure.
        }
      }
    }
    console.log('Compensation completed.');
  }
}

const sagaOrchestrator = new SagaOrchestrator();

module.exports = {
  SagaOrchestrator,
  sagaOrchestrator,
};
