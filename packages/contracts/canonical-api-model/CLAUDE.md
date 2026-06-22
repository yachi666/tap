# @tap/canonical-api-model

The **unified API representation** — the most important stable seam in the TAP platform.

Every API source adapter (OpenAPI, RAML, code discovery) **MUST** produce this model. Every consumer (test generation, workflow compiler, API browser) **ONLY** depends on this model, never on adapter-specific formats.

## Schema version

`tap.canonical-api/v1`

## Structure

```
CanonicalApiModel
├── metadata: ApiSourceMetadata (source type, parser, hash, timestamps)
├── servers: Server[]
├── securitySchemes: SecurityScheme[]
├── security: SecurityRequirement[] (default)
├── schemas: Record<string, ApiSchemaNode> (keyed by canonical path)
├── endpoints: Endpoint[]
└── diagnostics: Diagnostic[]
```

## Key types

- **`Endpoint`** — The core unit. Stable id = `{normalizedMethod} {normalizedPath}`. Carries parameters, requestBodies, responses, security overrides, and sourceLocations.
- **`ApiSchemaNode`** — JSON Schema subset with stable canonical path identifiers. Supports composition (allOf/oneOf/anyOf).
- **`ApiVersion`** — Immutable published snapshot wrapping a CanonicalApiModel. Created after successful parse + validation.
- **`ApiChangeSet`** — Diff between two ApiVersions. Tracks added/removed/modified endpoints and schemas, marks breaking changes, lists affected TestCaseVersions and WorkflowVersions.

## Design invariants

1. Endpoints and schemas have **stable, deterministic identifiers** — no UUIDs, no database row IDs.
2. **Source locations** are preserved for every structural element (file path, line number).
3. **Diagnostics are first-class** — warnings must not be silently dropped.
4. Published ApiVersions are **immutable**.

## Dependencies

- `@tap/contracts-common` — EntityId, ContentHash, Instant, Diagnostic, HTTP types, ImmutableVersionMeta

## Golden tests

Run: `vitest run` — serializes schemas to JSON and compares against `__tests__/__snapshots__/`.

## When to modify

- **Add a field**: Check all adapters (currently only `@tap/openapi-adapter`) and all consumers (test generation, workflow compiler). Update golden test snapshots.
- **Change a field type**: This is a **breaking change**. Coordinate with all downstream packages and schedule a contract version bump.
- **Add a new top-level entity**: Follow the Endpoint pattern — stable id, source locations, immutability.
