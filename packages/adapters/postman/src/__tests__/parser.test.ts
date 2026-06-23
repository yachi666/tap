import { describe, expect, it } from 'vitest';
import { parseCollection } from '../parser/collection.js';
import { parseEnvironment } from '../parser/environment.js';
import { POSTMAN_ECHO_COLLECTION } from './fixtures/postman-echo.js';

describe('parseCollection', () => {
  it('parses a valid Postman Collection v2.1', () => {
    const { collection, diagnostics } = parseCollection(POSTMAN_ECHO_COLLECTION);
    expect(collection).not.toBeNull();
    expect(collection!.info.name).toBe('Postman Echo');
    expect(collection!.item.length).toBeGreaterThan(0);
    expect(diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
  });

  it('rejects non-object input', () => {
    const { collection, diagnostics } = parseCollection('not an object');
    expect(collection).toBeNull();
    expect(diagnostics.some((d) => d.severity === 'error')).toBe(true);
  });

  it('rejects missing info.schema', () => {
    const { collection, diagnostics } = parseCollection({ item: [] });
    expect(collection).toBeNull();
    expect(diagnostics.some((d) => d.code === 'INVALID_COLLECTION')).toBe(true);
  });

  it('rejects Postman v1 with helpful message', () => {
    const { collection, diagnostics } = parseCollection({
      info: {
        name: 'V1 Collection',
        schema: 'https://schema.getpostman.com/json/collection/v1/',
      },
      requests: [],
      folders: [],
    });
    expect(collection).toBeNull();
    expect(diagnostics.some((d) => d.message.includes('v1'))).toBe(true);
  });

  it('rejects null input', () => {
    const { collection, diagnostics } = parseCollection(null);
    expect(collection).toBeNull();
    expect(diagnostics.some((d) => d.severity === 'error')).toBe(true);
  });

  it('rejects missing item array', () => {
    const { collection, diagnostics } = parseCollection({
      info: {
        name: 'Test',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
    });
    expect(collection).toBeNull();
    expect(diagnostics.some((d) => d.code === 'EMPTY_COLLECTION')).toBe(true);
  });

  it('accepts JSON string input', () => {
    const json = JSON.stringify(POSTMAN_ECHO_COLLECTION);
    const { collection, diagnostics } = parseCollection(json);
    expect(collection).not.toBeNull();
    expect(collection!.info.name).toBe('Postman Echo');
    expect(diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
  });

  it('warns when collection name is empty', () => {
    const { collection, diagnostics } = parseCollection({
      info: {
        name: '',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [{ name: 'Req', request: { method: 'GET', url: 'https://example.com' } }],
    });
    expect(collection).not.toBeNull();
    expect(diagnostics.some((d) => d.code === 'MISSING_NAME')).toBe(true);
  });
});

describe('parseEnvironment', () => {
  it('parses a valid Postman Environment', () => {
    const { env, diagnostics } = parseEnvironment({
      name: 'Production',
      values: [
        { key: 'baseUrl', value: 'https://api.example.com', enabled: true },
        { key: 'token', value: 'secret123', enabled: true },
      ],
    });
    expect(env).not.toBeNull();
    expect(env!.values).toHaveLength(2);
    expect(diagnostics).toHaveLength(0);
  });

  it('rejects missing values array', () => {
    const { env, diagnostics } = parseEnvironment({ name: 'Empty' });
    expect(env).toBeNull();
    expect(diagnostics.some((d) => d.severity === 'error')).toBe(true);
  });

  it('rejects null input', () => {
    const { env, diagnostics } = parseEnvironment(null);
    expect(env).toBeNull();
    expect(diagnostics.some((d) => d.severity === 'error')).toBe(true);
  });

  it('rejects missing name', () => {
    const { env, diagnostics } = parseEnvironment({ values: [] });
    expect(env).toBeNull();
    expect(diagnostics.some((d) => d.code === 'INVALID_ENVIRONMENT')).toBe(true);
  });

  it('accepts JSON string input', () => {
    const json = JSON.stringify({
      name: 'Staging',
      values: [{ key: 'url', value: 'https://staging.example.com' }],
    });
    const { env, diagnostics } = parseEnvironment(json);
    expect(env).not.toBeNull();
    expect(env!.name).toBe('Staging');
    expect(diagnostics).toHaveLength(0);
  });
});
