/**
 * @fileoverview A service for collecting and exposing application metrics in the Prometheus format.
 * @module src/metrics_service
 */

/**
 * Represents a single metric, holding its name, help text, labels, and value.
 * @class
 */
class Metric {
  /**
   * Creates a new Metric.
   * @param {string} name - The name of the metric.
   * @param {string} help - The help text for the metric.
   */
  constructor(name, help) {
    this.name = name;
    this.help = help;
    this.values = new Map();
  }

  /**
   * Generates a unique key for a given set of labels.
   * @param {Object<string, string>} [labels={}] - The labels for the metric.
   * @returns {string} The serialized label key.
   */
  _getLabelKey(labels = {}) {
    return JSON.stringify(Object.entries(labels).sort());
  }
}

/**
 * A counter metric that can only be incremented.
 * @class
 * @extends Metric
 */
class Counter extends Metric {
  /**
   * Increments the counter for a given set of labels.
   * @param {Object<string, string>} [labels={}] - The labels for the metric.
   * @param {number} [value=1] - The value to increment by.
   */
  increment(labels = {}, value = 1) {
    const key = this._getLabelKey(labels);
    const currentValue = this.values.get(key)?.value || 0;
    this.values.set(key, { labels, value: currentValue + value });
  }
}

/**
 * A gauge metric that can be set to any value.
 * @class
 * @extends Metric
 */
class Gauge extends Metric {
  /**
   * Sets the gauge value for a given set of labels.
   * @param {Object<string, string>} labels - The labels for the metric.
   * @param {number} value - The value to set.
   */
  set(labels, value) {
    const key = this._getLabelKey(labels);
    this.values.set(key, { labels, value });
  }
}

/**
 * A service that collects and manages application metrics.
 * @class
 */
class MetricsService {
  /**
   * Creates a new MetricsService.
   * This class is designed to be a singleton.
   */
  constructor() {
    this.counters = new Map();
    this.gauges = new Map();
  }

  /**
   * Registers a new counter.
   * @param {string} name - The name of the counter.
   * @param {string} help - The help text for the counter.
   */
  registerCounter(name, help) {
    if (this.counters.has(name)) {
      return;
    }
    this.counters.set(name, new Counter(name, help));
  }

  /**
   * Increments a registered counter.
   * @param {string} name - The name of the counter.
   * @param {Object<string, string>} [labels={}] - The labels for the metric.
   * @param {number} [value=1] - The value to increment by.
   */
  incrementCounter(name, labels = {}, value = 1) {
    const counter = this.counters.get(name);
    if (counter) {
      counter.increment(labels, value);
    }
  }

  /**
   * Registers a new gauge.
   * @param {string} name - The name of the gauge.
   * @param {string} help - The help text for the gauge.
   */
  registerGauge(name, help) {
    if (this.gauges.has(name)) {
      return;
    }
    this.gauges.set(name, new Gauge(name, help));
  }

  /**
   * Sets the value of a registered gauge.
   * @param {string} name - The name of the gauge.
   * @param {Object<string, string>} labels - The labels for the metric.
   * @param {number} value - The value to set.
   */
  setGauge(name, labels, value) {
    const gauge = this.gauges.get(name);
    if (gauge) {
      gauge.set(labels, value);
    }
  }

  /**
   * Renders all registered metrics in the Prometheus exposition format.
   * @returns {string} The formatted metrics string.
   */
  render() {
    let output = '';
    const metrics = [...this.counters.values(), ...this.gauges.values()];

    for (const metric of metrics) {
      output += `# HELP ${metric.name} ${metric.help}\n`;
      output += `# TYPE ${metric.name} ${metric instanceof Counter ? 'counter' : 'gauge'}\n`;

      for (const { labels, value } of metric.values.values()) {
        const labelStr = Object.entries(labels)
          .map(([key, val]) => `${key}="${val}"`)
          .join(',');
        const finalLabelStr = labelStr ? `{${labelStr}}` : '';
        output += `${metric.name}${finalLabelStr} ${value}\n`;
      }
      output += '\n';
    }

    return output;
  }
}

/**
 * The singleton instance of the MetricsService.
 * @type {MetricsService}
 */
const metricsService = new MetricsService();

module.exports = {
  metricsService,
};
