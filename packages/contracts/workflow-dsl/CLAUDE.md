# @sketch-test/workflow-dsl

Defines the structure of a **multi-step API workflow** — the human-editable format consumed by the workflow editor in the web app.

## Schema version

`sketch-test.workflow/v1`

## Core types

### WorkflowDefinition
The editor document. The **Workflow Compiler** transforms this into an `ExecutionPlan` (from `@sketch-test/runner-protocol`) at publish time.
- `steps`: Sequential WorkflowStep array (1–50, V1 hard limit)
- `teardown`: Optional teardown phase with configurable strategy

### WorkflowStep
Each step either references a published `TestCaseVersion` or defines an inline request.
- `useTest`: Discriminated union — `{kind: 'test-version', testVersionId}` or `{kind: 'inline', method, url, ...}`
- `inputs`: Variable mappings from previous steps or environment
- `condition`: Execution condition with onFalse behavior (skip/fail)
- `retry`: Max retries, backoff, status-based retry triggers
- `poll`: Repeated execution until condition or timeout (interval, maxDuration, maxAttempts, untilExpression)
- `onFailure`: stop / skip / goto / teardown-and-stop

### Teardown
Simplified steps that run after the main workflow:
- `strategy`: always / on-success / on-failure / never
- `steps`: Teardown steps (no conditions, no polling, capped retries at 3)

### WorkflowVersion
Immutable published workflow. Includes the compiled ExecutionPlan hash.

### WorkflowDiagnostics
Compiler output: valid/invalid, unresolved variables, step warnings.

## Key business workflows (from CONTEXT.md)

| ID | Process | Steps |
|----|---------|-------|
| BP-01 | User registration & auth | POST /users → POST /auth/login → GET /auth/me |
| BP-02 | Create order & pay | POST /auth/login → POST /orders → POST /payments → GET /orders/{id} |
| BP-03 | Order lifecycle | POST /orders → GET /orders/{id} → DELETE /orders/{id} |
| BP-04 | User info query | POST /auth/login → GET /users/{id} |
| BP-05 | Payment status polling | POST /payments → GET /orders/{id} (poll until status=已支付) |
| BP-06 | Duplicate payment protection | POST /payments → POST /payments (same orderId) |
| BP-07 | Auth failure handling | POST /auth/login (bad credentials) → assert 401 |
| BP-08 | Validation failure | POST /users (missing fields) → assert 400 + fieldProblems |

## Design invariants

1. Published WorkflowVersions are **immutable**.
2. All variable references are **checked at compile time**.
3. Loops, polls, and retries have **explicit upper bounds** (no unbounded execution).
4. Teardown forms an **independent phase** with configurable failure strategy.
5. The Runner **never** directly executes mutable editor documents — only ExecutionPlans.

## Dependencies

- `@sketch-test/contracts-common` — EntityId, ContentHash, Instant, VariableRef, ImmutableVersionMeta, Diagnostic
- Compiles to `@sketch-test/runner-protocol` ExecutionPlan
