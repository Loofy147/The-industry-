# Gap Report: Metrics and Monitoring

## 1. Executive Summary

The system currently lacks a dedicated metrics collection and exposition layer, which is a critical gap for any production-grade application. While structured logging and tracing provide insights into specific events, they do not offer the quantitative, aggregate data needed for effective monitoring, alerting, and performance analysis. This proposal outlines the implementation of a Prometheus-compatible metrics system to fill this gap.

## 2. The Gap: Lack of Quantitative Observability

-   **No Health Monitoring:** It is impossible to answer the question, "Is the system healthy right now?" without aggregate data on request rates, error rates, and resource utilization.
-   **Reactive Failure Detection:** Problems are only discovered after they have caused a user-facing failure or a critical log entry. There is no way to proactively identify performance degradation or impending issues.
-   **Inability to Scale or Optimize:** Without performance metrics (e.g., request latency, message bus throughput), there is no data to inform scaling decisions or identify optimization opportunities.
-   **No Alerting Capability:** The absence of a metrics layer prevents the creation of automated alerts that could notify operators of issues (e.g., "API error rate exceeds 5%") before they become catastrophic.

This gap means that running the system in production would be a high-risk endeavor, characterized by lengthy incident response times and an inability to understand the system's real-world performance.

## 3. The Solution: A Prometheus-Compatible Metrics System

To address this gap, we will implement a centralized `MetricsService` and expose the collected data via a standard `/metrics` endpoint.

### 3.1. Core Components

1.  **Metrics Service (`src/metrics_service.js`):**
    *   A singleton service that acts as a registry for all application metrics.
    *   It will support standard metric types:
        *   **Counter:** A cumulative metric that represents a single monotonically increasing counter (e.g., `http_requests_total`).
        *   **Gauge:** A metric that represents a single numerical value that can arbitrarily go up and down (e.g., `circuit_breaker_state`).
        *   **Histogram:** A metric that samples observations (e.g., request durations) and counts them in configurable buckets.

2.  **/metrics Endpoint:**
    *   A new `GET /metrics` endpoint on the main server that renders all registered metrics in the Prometheus exposition format. This format is a de facto industry standard, ensuring immediate compatibility with a wide ecosystem of tools.

### 3.2. Initial Instrumentation

The `MetricsService` will be integrated into key components to provide immediate, high-value insights:

-   **API Server:** Middleware will be added to track `http_requests_total` (with labels for method, path, and status code) and `http_request_duration_seconds`.
-   **Message Bus:** The bus will increment a counter (`message_bus_events_published_total`) for every event published.
-   **Circuit Breaker:** Each breaker instance will register a gauge (`circuit_breaker_state`) to expose its current state numerically.

## 4. Verification

The success of this implementation will be verified by a new test suite (`tests/metrics.test.js`) that:
1.  Executes a series of actions (e.g., makes API calls).
2.  Scrapes the `/metrics` endpoint.
3.  Asserts that the metrics have been updated as expected.

This ensures that the metrics system is not only present but is also accurately reflecting the system's behavior.
