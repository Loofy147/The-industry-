# Gap Report: Event Sourcing Lifecycle Management

## 1. Executive Summary

A system's vision is defined by its ability to manage its own truth over time. In our event-sourced architecture, the immutable `EventStore` is the ultimate source of truth. However, the system currently lacks the foundational mechanisms to manage the lifecycle of this truth, which undermines its long-term trustworthiness, performance, and evolvability.

This report identifies a critical, high-level gap in **Event Sourcing Lifecycle Management**. This multi-gap comprises two related problems: a lack of performance optimization for long-lived aggregates and an inability to recover or evolve read models. To address this, we will implement two core industry patterns: **State Snapshotting** for performance and **Projector Replayability** for resilience and evolution. Implementing this vision will make our system's state verifiable, recoverable, and auditable, which is the cornerstone of a trustworthy and valuable architecture.

## 2. Analysis of the Gap

The absence of lifecycle management for our event-sourced data creates the following critical issues:

1.  **Performance Degradation:** The current `UserRepository` reconstructs an aggregate's state by replaying its *entire* event history from the beginning. For an aggregate with thousands of events, this process becomes a significant performance bottleneck, leading to high latency and poor scalability.
2.  **Inability to Recover from Errors:** Read models, which are critical for serving queries, can become corrupted or fall out of sync with the event log due to bugs in a projector's logic. Without a mechanism to rebuild them, the system's state becomes permanently inconsistent, and there is no path to recovery short of manual data intervention.
3.  **Barrier to Evolution:** As business requirements change, so must our read models. The inability to replay events and rebuild projections makes it nearly impossible to safely evolve read model schemas or introduce new ones based on historical data. The system's architecture becomes brittle and resistant to change.

A system that cannot efficiently access, verify, and recover its own truth is not trustworthy.

## 3. High-Level Solution

To provide a comprehensive vision for the system's data lifecycle, we will implement a two-part solution:

1.  **Implement State Snapshotting:**
    *   **Create a `SnapshotStore`:** A new persistence service, `src/snapshot_store.js`, will be created to store and retrieve periodic snapshots of an aggregate's state.
    *   **Integrate with the `UserRepository`:** The `UserRepository` will be refactored to be "snapshot-aware." When loading an aggregate, it will first attempt to restore from the latest snapshot and then replay only the events that have occurred *since* that snapshot was taken.
    *   **Update the Aggregate:** The `User` aggregate will be modified to track its version and expose its internal state to allow the repository to create snapshots at regular intervals (e.g., every 10 events).

2.  **Implement Projector Replayability:**
    *   **Create a `ProjectorManager`:** A new service, `src/projector_manager.js`, will be created to register and manage all projectors in the system, making them discoverable.
    *   **Enhance the Control API:** A new endpoint, `POST /control/projectors/:name/replay`, will be added. This API will instruct the `ProjectorManager` to reset a specific projector and rebuild its state by re-reading the entire event history from the `EventStore`.
    *   **Refactor Existing Projectors:** The `UserReadModelProjector` will be updated to be managed by the `ProjectorManager`, making it replayable.

3.  **Verification through Testing:** A new test suite, `tests/event_sourcing_lifecycle.test.js`, will be created to prove the solution. The test will verify that snapshots are created and used, and more importantly, it will simulate a corrupted read model, trigger a replay via the new Control API, and assert that the read model is successfully rebuilt and corrected. This will provide undeniable proof that the system's state is recoverable and trustworthy.
