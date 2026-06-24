# @sketch-test/adapter-postman

> Postman Collection v2.1 → CanonicalApiModel adapter

## Role

Converts Postman Collection v2.1 exports (and Postman Environments) into the platform's unified `CanonicalApiModel`. This is the most feature-rich adapter — it handles folder hierarchies, variable resolution, auth extraction, assertion mapping, and workflow hint generation.

## Architecture

```
src/
  index.ts            # Main entry: importPostmanCollection()
  types.ts            # Postman-specific types (Collection, Item, etc.)
  parser/
    index.ts          # Top-level parsing orchestration
  mapper/
    endpoints.ts      # Item tree → Endpoint[] (with folder flattening)
    assertions.ts     # Postman test scripts → Assertion[]
    auth.ts           # Auth config → SecurityScheme
```

## Scope

- Postman Collection v2.1 JSON
- Item groups (folders) → flattened with path prefix in endpoint labels
- Request: method, URL (with `{{variable}}` templates), headers, body
- Response: saved examples → `Response[]`
- Auth: Basic, Bearer, API Key, OAuth 2.0 → `SecurityScheme`
- Variables: collection and environment variables → resolved at import time
- Postman test scripts (pm.test, pm.expect) → `Assertion[]`
- Diagnostics for unsupported constructs (pre-request scripts, Newman-specific features)

## Mapping

| Postman concept | Canonical API Model |
|----------------|---------------------|
| `item[].request.method` | `Endpoint.method` |
| `item[].request.url.raw` | `Endpoint.path` (normalized, variables resolved) |
| `item[].request.header[]` | `Endpoint.parameters` (header type) |
| `item[].request.url.query[]` | `Endpoint.parameters` (query type) |
| `item[].request.body` | `Endpoint.requestBodies` |
| `item[].response[]` | `Endpoint.responses` |
| `auth` | `SecurityScheme` |
| `variable[]` | Resolved and recorded in metadata |
| `item[].name` (folder path) | Endpoint tags/labels |

## API

```typescript
import { importPostmanCollection } from '@sketch-test/adapter-postman';

const result = importPostmanCollection(collectionJson, {
  sourceLabel: 'my-api.postman_collection.json',
  sourceHash: 'sha256...',
});
// result.model: CanonicalApiModel | null
// result.diagnostics: Diagnostic[]
```

## Design invariants

1. **Failed imports return `model: null`** — validation errors prevent partial output.
2. **All structural elements carry source provenance** — Postman item path + index.
3. **Warnings for unsupported constructs are never silently dropped** — pre-request scripts, Newman runners, etc.
4. **Stable endpoint ids**: `METHOD-normalized/path` matching the OpenAPI adapter convention.
5. **Output always passes `CanonicalApiModelSchema` validation**.

## Dependencies

- `@sketch-test/canonical-api-model` — output target
- `@sketch-test/contracts-common` — EntityId, ContentHash, Diagnostic, HTTP types

## When to modify

- **Add new auth type mapping**: Extend `mapper/auth.ts`.
- **Support Postman variables in more locations**: Update the variable resolution pass in `parser/`.
- **Improve assertion extraction**: Postman scripts are JavaScript strings — regex-based extraction has limits.
