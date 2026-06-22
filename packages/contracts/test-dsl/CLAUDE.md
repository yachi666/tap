# @tap/test-dsl

Defines the structure of a **single REST API test case** — the editor format consumed by the test authoring UI.

## Schema version

`tap.test/v1`

## Core types

### TestDefinition
The editor-format document for one REST API test. A published version becomes an immutable `TestCaseVersion`.
- `request`: HTTP method, URL template, headers, query, cookies, body, auth config, timeout
- `assertions`: Array of assertions (status, header, jsonPath, body, responseTime, schema) with operators and severities
- `extract`: Variables to extract from the response (JSONPath from body/headers/status/cookies)
- `sideEffect`: Safety classification (default: `read-only`)
- `generationSource`: Provenance for AI/rule-generated tests (strategy, model info, confidence)

### TestCaseVersion
Immutable published test case. Historical runs always reference the exact version used.
- Wraps a TestDefinition with ImmutableVersionMeta
- Includes approval status (approved, approvedBy, approvedAt)
- Tracks validation status: `unvalidated → syntax-valid → compiled → executed-once → stable-pass/fail/flaky`

### TestDraft
A generated or edited-but-unpublished test. **Drafts cannot enter CI suites.**
- Mutable container with optimistic locking (expectedRevision)
- Carries a validation report (valid + diagnostics)

## Generation strategies
- `example` — from OpenAPI examples
- `schema-positive` / `schema-missing-required` / `schema-invalid-type` / `schema-boundary` — schema-based
- `protocol-auth` / `protocol-content-type` — protocol-level
- `stateful-crud` — CRUD chains
- `ai-code-enhanced` — AI with code evidence

## Assertion operators
`equals`, `notEquals`, `contains`, `notContains`, `exists`, `notExists`, `greaterThan`, `lessThan`, `matches` (regex), `type`, `schema`, `hasItems`, `isEmpty`

## Design invariants

1. Published TestCaseVersions are **immutable**.
2. Variable references (`${step.varName}`) are resolved at **compile time** (scope + name), not runtime.
3. Each assertion independently records expected and actual values.
4. Drafts cannot enter CI suites until published.
5. Generation sources are preserved for evidence (traceability).

## Dependencies

- `@tap/contracts-common` — EntityId, ContentHash, Instant, HTTP types, SideEffectLevel, ConfidenceLevel, VariableRef, ImmutableVersionMeta, Diagnostic
