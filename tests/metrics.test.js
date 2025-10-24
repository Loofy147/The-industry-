const request = require('supertest');
const { server } = require('../server');
const { messageBus } = require('../src/message_bus');
const { circuitBreakerRegistry } = require('../src/circuit_breaker_registry');
const { CircuitBreaker } = require('../src/circuit_breaker');
require('../schemas/test_event');

describe('Metrics System', () => {
  it('should expose HTTP request metrics via the /metrics endpoint', async () => {
    // Make a request to a known endpoint
    await request(server).get('/healthz').expect(200);

    // Scrape the metrics endpoint
    const response = await request(server).get('/metrics').expect(200);
    const metrics = response.text;

    // Verify the http_requests_total metric is present and correct
    expect(metrics).toContain('# HELP http_requests_total Total number of HTTP requests.');
    expect(metrics).toContain('# TYPE http_requests_total counter');
    expect(metrics).toContain('http_requests_total{method="GET",path="/healthz"} 1');
  });

  it('should expose message bus metrics', async () => {
    // Publish an event
    messageBus.publish('TestEvent', { data: 'test' });

    // Scrape the metrics endpoint
    const response = await request(server).get('/metrics').expect(200);
    const metrics = response.text;

    // Verify the message_bus_events_published_total metric
    expect(metrics).toContain('# HELP message_bus_events_published_total Total number of events published to the message bus.');
    expect(metrics).toContain('# TYPE message_bus_events_published_total counter');
    expect(metrics).toContain('message_bus_events_published_total{topic="TestEvent"} 1');
  });

  it('should expose circuit breaker state metrics', async () => {
    // Create and register a new circuit breaker for this test
    const breaker = new CircuitBreaker('TestMetricsBreaker');
    circuitBreakerRegistry.register('TestMetricsBreaker', breaker);

    // Scrape the metrics endpoint
    const response = await request(server).get('/metrics').expect(200);
    const metrics = response.text;

    // Verify the circuit_breaker_state gauge
    expect(metrics).toContain('# HELP circuit_breaker_state The current state of a circuit breaker (0=CLOSED, 1=OPEN, 2=HALF_OPEN).');
    expect(metrics).toContain('# TYPE circuit_breaker_state gauge');
    // It should be in the CLOSED (0) state initially
    expect(metrics).toContain('circuit_breaker_state{name="TestMetricsBreaker"} 0');
  });
});
