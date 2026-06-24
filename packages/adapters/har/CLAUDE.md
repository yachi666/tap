# @sketch-test/adapter-har

> HAR 1.2 (HTTP Archive) → CanonicalApiModel adapter

## Role

Converts HAR 1.2 files into the platform's unified `CanonicalApiModel`. Each HAR entry (a request + response pair) becomes an endpoint with its recorded response. Useful for importing traffic captures from browser DevTools, proxies, or other HTTP recording tools.

## Scope

- HAR 1.2 JSON files
- Entries: request (method, url, headers, postData) → `Endpoint`
- Entries: response (status, headers, content) → `Response`
- Query string parameters → `Parameter[]`
- Headers → `Parameter[]`
- Content type and body size metadata
- Diagnostics for malformed entries

## Mapping

| HAR concept | Canonical API Model |
|-------------|---------------------|
| `log.entries[].request.method` | `Endpoint.method` |
| `log.entries[].request.url` | `Endpoint.path` (normalized) |
| `log.entries[].request.headers` | `Endpoint.parameters` (header type) |
| `log.entries[].request.queryString` | `Endpoint.parameters` (query type) |
| `log.entries[].request.postData` | `Endpoint.requestBodies` |
| `log.entries[].response` | `Response` with status, headers, content |

## API

```typescript
import { importHar } from '@sketch-test/adapter-har';

const result = importHar(harJson, {
  sourceLabel: 'my-capture.har',
  sourceHash: 'sha256...',
});
// result.model: CanonicalApiModel | null
// result.diagnostics: Diagnostic[]
```

## Design invariants

1. **Failed imports return `model: null`** — never a partial model.
2. **All structural elements carry source locations** pointing back to the HAR entry index.
3. **Warnings for malformed entries are never silently dropped**.
4. **Stable endpoint ids**: `METHOD-normalized/path` (same convention as OpenAPI adapter).

## Dependencies

- `@sketch-test/canonical-api-model` — output target
- `@sketch-test/contracts-common` — EntityId, ContentHash, Diagnostic, HTTP types

## When to modify

- **Support HAR 1.3+**: Update the version guard and add any new field mappings.
- **Add response body parsing**: HAR stores bodies as text/base64 — add content-type-aware parsing for JSON bodies.
