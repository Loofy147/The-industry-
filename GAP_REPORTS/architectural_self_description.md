# Gap Report: Architectural Self-Description and Discovery

## 1. Executive Summary

A deep understanding of software architecture requires a system to be more than just a collection of services; it must have a formal, machine-readable understanding of its own composition. Currently, the relationships between services—what events they publish, what they subscribe to, and the schemas they depend on—are based on implicit, "tribal" knowledge held by developers. This represents a critical gap in **architectural self-description and discovery**.

This lack of an explicit architectural definition makes the system difficult to scale, maintain, and safely evolve. We propose the implementation of a **Service Registry** and a **Service Manifest** standard. This will create a formal "language" for services to declare their capabilities and dependencies, allowing the system to discover, validate, and represent its own architecture at runtime.

## 2. Analysis of the Gap

The reliance on implicit knowledge and manual configuration leads to several significant problems:

-   **High Maintenance Overhead:** As the system grows, it becomes increasingly difficult for developers to understand the full impact of their changes. Answering questions like "Which services will be affected if I change the `UserRegistered` event?" requires a manual, error-prone search across the entire codebase.
-   **No Architectural Validation:** The system has no way to automatically verify its own integrity. It cannot detect if a service is subscribing to an event that is never published, or if a critical event has no subscribers. This leads to "dead" code and makes architectural drift inevitable.
-   **Lack of Runtime Discoverability:** Operators and other services have no way to query the system's architecture at runtime. This makes it impossible to build dynamic tooling, automated documentation, or advanced monitoring that is aware of the system's structure. The system is a black box that cannot describe itself.

A truly advanced architecture is not just well-designed; it is self-aware.

## 3. High-Level Solution

The proposed solution is to introduce a formal, machine-readable definition for each service and a central registry that consumes these definitions to build a runtime map of the architecture.

1.  **Define a `service-manifest.json` Standard:** We will establish a standard JSON file format that each service must include. This "manifest" will declare key metadata:
    *   `name`: A unique identifier for the service (e.g., `user_service`).
    *   `description`: A human-readable description of the service's purpose.
    *   `publishes`: An array of events the service can publish, including the event name and the schema it adheres to.
    *   `subscribes`: An array of events the service subscribes to.

2.  **Implement a `ServiceRegistry`:** A new module, `src/service_registry.js`, will be created. At application startup, this registry will scan the `systems/` directory for all `service-manifest.json` files and load them into memory, creating a comprehensive, queryable map of the system's architecture.

3.  **Enhance the Control API for Introspection:** The existing `/control` API will be extended with a new endpoint:
    *   `GET /control/services`: This endpoint will return the full architectural map from the `ServiceRegistry`, allowing operators and tools to discover the system's services and their interdependencies at runtime.

4.  **Create Manifests for Existing Services:** We will create `service-manifest.json` files for the `user_service` and `notification_service` to formally declare their contracts and integrate them into the new discovery process.

5.  **Verification through Testing:** A new test suite, `tests/service_registry.test.js`, will be created. It will use an HTTP client to call the `/control/services` endpoint and assert that the API's response correctly reflects the architecture defined in the manifest files. This will prove that the system can now accurately describe itself.
