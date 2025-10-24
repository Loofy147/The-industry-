# Gap Report: System Introspection and Control

## 1. Executive Summary

A truly powerful system is not just one with a robust internal architecture; it is one that can represent its own state and be controlled in real-time. The current application, while incorporating advanced patterns like Circuit Breakers and Dynamic Configuration, remains a "black box" during runtime. Operators have no direct way to observe the health of its internal components or to influence its behavior without a disruptive redeployment.

This report identifies a significant architectural gap: the lack of a **runtime introspection and control plane**. This plane is essential for operability, resilience, and risk management in a modern, distributed system. We propose the implementation of a secure, internal **Control API** to expose the system's core components for observation and management, thereby making the system's "prospect and power" tangible and controllable.

## 2. Analysis of the Gap

The absence of a control plane manifests in several critical operational deficiencies:

-   **Poor Observability of Key Components:** While we have a Circuit Breaker, we cannot ask it, "What is your current state?" during an incident. We have feature flags, but we cannot easily list which flags are active on a given node. This lack of introspection makes diagnosing and mitigating problems a slow, reactive process.
-   **Manual and Disruptive Control:** The only way to change the system's behavior (e.g., disable a feature causing errors) is to update a configuration file and redeploy the service. This is a slow, high-risk operation that introduces downtime and is unsuitable for emergency interventions.
-   **Hidden State:** The state of critical components like the Message Bus Dead Letter Queue (DLQ) is hidden within the running process. Operators cannot inspect failed messages to diagnose a faulty producer without accessing the server's logs directly, which is inefficient and often difficult in a containerized environment.

A powerful system should not be a black box; it should provide the tools for its own management.

## 3. High-Level Solution

The proposed solution is to implement a dedicated, internal-only Control API, served on the same application port but under a distinct `/control` namespace. This API will be the primary interface for system introspection and control.

1.  **Implement the Control API in `server.js`:** The main server logic will be enhanced to parse and route requests to the `/control` endpoint. It will handle JSON request bodies and provide appropriate HTTP responses.

2.  **Expose Core Services via Endpoints:** The API will provide the following endpoints:
    *   `GET /control/config`: Securely returns the current state of the `ConfigService`.
    *   `PATCH /control/config`: Allows for updating one or more configuration values in real-time, providing immediate control over feature flags and system parameters.
    *   `GET /control/circuit-breakers`: Provides the current state (e.g., `OPEN`, `CLOSED`), failure counts, and last failure time of all registered circuit breakers.
    *   `GET /control/message-bus/dlq`: Returns the contents of the Message Bus Dead Letter Queue, allowing operators to inspect malformed messages.

3.  **Create a `CircuitBreakerRegistry`:** To make the circuit breakers discoverable by the API, a simple, injectable registry (`src/circuit_breaker_registry.js`) will be created. All new circuit breakers will be registered with a unique name.

4.  **Verification through Testing:** A new test suite, `tests/control_api.test.js`, will be created. This test will use an HTTP client (like `supertest`) to interact with the running application and verify that the control plane works as expected. The test will prove that an operator can observe and change the system's state through the API.
