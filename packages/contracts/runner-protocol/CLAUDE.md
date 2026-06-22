# @sketch-test/runner-protocol

Defines everything the **Runner** and **Control Plane** must agree on to communicate.

## Schema version

`sketch-test.runner-protocol/v1`

## Three concerns

### 1. ExecutionPlan (compiled workflow)
The **immutable, compiled plan** the Runner executes. Created by the Workflow Compiler at publish time. The Runner **never** sees mutable editor documents.

- `FrozenStep` — Concrete HTTP request with all variable refs resolved. Includes retry config, polling config, assertions, extractions, side-effect classification.
- `FrozenTeardownStep` — Simplified teardown step (no conditions, no polling, capped retries).
- `ExecutionPlan` — Ordered list of steps + optional teardown phase.

### 2. RunEvent (execution log)
Ordered, idempotent events the Runner uploads. `(runId, sequence)` unique — duplicate uploads are idempotent.

Event types (discriminated union):
- `run.started` / `run.finished`
- `step.started` / `step.finished` / `step.retried`
- `request.prepared` / `request.sent` / `response.received`
- `assertion.evaluated`
- `variable.extracted`
- `teardown.started`

### 3. Runner Lifecycle
- `RunnerRegistration` — Runner identity + capabilities (labels, concurrency, protocol versions)
- `Heartbeat` — Periodic health ping with current load
- `WorkLease` — Assigned task (leaseId, runId, planRef, expiresAt, secretAuthToken)
- `LeaseAck` — Runner accepts or rejects a lease

## Run state machine

Valid transitions (any other transition is rejected):
```
queued → leased → running → passed / failed / inconclusive / cancelled / orphaned
queued → cancelled
leased → queued (lease expiry)
orphaned → inconclusive / queued
```

## Quality Gate

`QualityGateConfig` defines post-execution criteria:
- Require critical workflows pass
- Allow no new failures
- Max flaky count
- Min coverage percentage
- Required tags

`QualityGateResult`: passed / failed / blocked / inconclusive / cancelled

## Security invariants

1. **Secrets are resolved by the Runner** at execution time, never appear in events.
2. **Sensitive data is redacted** on the Runner side before event upload.
3. Sensitive headers (authorization, cookie, api-key, etc.) are always redacted to `***REDACTED***`.
4. Sensitive JSON fields (password, token, secret, accessToken, etc.) are recursively redacted.
5. **Lease expiry does not** auto-create a second concurrent execution.

## Dependencies

- `@sketch-test/contracts-common` — EntityId, ContentHash, Instant, HTTP types, SideEffectLevel, VariableRef
