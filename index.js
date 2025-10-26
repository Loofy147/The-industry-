// Initialize OpenTelemetry Tracing
require('./src/tracing');

const { start } = require('./server');

start();
