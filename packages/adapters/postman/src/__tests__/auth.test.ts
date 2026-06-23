/**
 * @sketch-test/adapter-postman — Auth mapping tests
 *
 * Tests for mapAuth(): Postman auth type → SecurityScheme mapping,
 * auth inheritance, and edge cases.
 */

import { describe, expect, it } from 'vitest';
import { mapAuth } from '../mapper/auth.js';
import type { PostmanAuth } from '../types.js';
import { makeSourceContext } from './helpers.js';

// ─── Helpers ─────────────────────────────────────────────────────────

const CTX = makeSourceContext();

/**
 * Create a PostmanAuth object with the given type and parameter array.
 */
function makeAuth(
  type: string,
  params: Array<{ key: string; value: string; type?: string }> = [],
): PostmanAuth {
  return {
    type,
    [type]: params,
  } as unknown as PostmanAuth;
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('mapAuth', () => {
  describe('auth type mapping', () => {
    it('should map noauth to empty security (skip)', () => {
      const auth = makeAuth('noauth');
      const result = mapAuth(auth, undefined, CTX);
      expect(result.securitySchemes).toHaveLength(0);
      expect(result.securityRequirement).toBeUndefined();
      expect(result.diagnostics).toHaveLength(0);
    });

    it('should map apikey auth correctly', () => {
      const auth = makeAuth('apikey', [
        { key: 'key', value: 'X-API-Key', type: 'string' },
        { key: 'value', value: 'my-api-key', type: 'string' },
        { key: 'in', value: 'header', type: 'string' },
      ]);
      const result = mapAuth(auth, undefined, CTX);
      expect(result.securitySchemes).toHaveLength(1);
      const scheme = result.securitySchemes[0]!;
      expect(scheme.type).toBe('apiKey');
      expect(scheme.name).toBe('X-API-Key');
      expect(scheme.in).toBe('header');
      expect(scheme.id).toBe('auth-apikey');
      expect(scheme.sourceLocation).toBeDefined();
      expect(result.securityRequirement).toEqual({ apikey: [] });
    });

    it('should map apikey with query location', () => {
      const auth = makeAuth('apikey', [
        { key: 'key', value: 'api_key', type: 'string' },
        { key: 'in', value: 'query', type: 'string' },
      ]);
      const result = mapAuth(auth, undefined, CTX);
      expect(result.securitySchemes[0]!.in).toBe('query');
    });

    it('should map basic auth correctly', () => {
      const auth = makeAuth('basic', [
        { key: 'username', value: 'admin', type: 'string' },
        { key: 'password', value: 'secret', type: 'string' },
      ]);
      const result = mapAuth(auth, undefined, CTX);
      expect(result.securitySchemes).toHaveLength(1);
      const scheme = result.securitySchemes[0]!;
      expect(scheme.type).toBe('http');
      expect(scheme.scheme).toBe('basic');
      expect(scheme.name).toBe('Basic Auth');
      expect(scheme.id).toBe('auth-basic');
    });

    it('should map bearer auth correctly', () => {
      const auth = makeAuth('bearer', [{ key: 'token', value: 'mytoken', type: 'string' }]);
      const result = mapAuth(auth, undefined, CTX);
      expect(result.securitySchemes).toHaveLength(1);
      const scheme = result.securitySchemes[0]!;
      expect(scheme.type).toBe('http');
      expect(scheme.scheme).toBe('bearer');
      expect(scheme.name).toBe('Bearer Auth');
    });

    it('should map digest auth correctly', () => {
      const auth = makeAuth('digest');
      const result = mapAuth(auth, undefined, CTX);
      const scheme = result.securitySchemes[0]!;
      expect(scheme.type).toBe('http');
      expect(scheme.scheme).toBe('digest');
      expect(scheme.name).toBe('Digest Auth');
    });

    it('should map hawk auth correctly', () => {
      const auth = makeAuth('hawk');
      const result = mapAuth(auth, undefined, CTX);
      const scheme = result.securitySchemes[0]!;
      expect(scheme.type).toBe('http');
      expect(scheme.scheme).toBe('hawk');
      expect(scheme.name).toBe('Hawk Auth');
    });

    it('should map ntlm auth correctly', () => {
      const auth = makeAuth('ntlm');
      const result = mapAuth(auth, undefined, CTX);
      const scheme = result.securitySchemes[0]!;
      expect(scheme.type).toBe('http');
      expect(scheme.scheme).toBe('ntlm');
      expect(scheme.name).toBe('NTLM Auth');
    });

    it('should map oauth1 auth correctly', () => {
      const auth = makeAuth('oauth1', [
        { key: 'consumerKey', value: 'ckey', type: 'string' },
        { key: 'consumerSecret', value: 'csecret', type: 'string' },
        { key: 'token', value: 'tok', type: 'string' },
      ]);
      const result = mapAuth(auth, undefined, CTX);
      const scheme = result.securitySchemes[0]!;
      expect(scheme.type).toBe('oauth2');
      expect(scheme.name).toBe('OAuth 1.0');
      expect(scheme.flows).toBeDefined();
      expect(scheme.flows!['oauth1']).toBeDefined();
    });

    it('should map oauth2 auth correctly', () => {
      const auth = makeAuth('oauth2', [
        { key: 'authUrl', value: 'https://auth.example.com/auth', type: 'string' },
        { key: 'tokenUrl', value: 'https://auth.example.com/token', type: 'string' },
        { key: 'scope', value: 'openid profile', type: 'string' },
      ]);
      const result = mapAuth(auth, undefined, CTX);
      const scheme = result.securitySchemes[0]!;
      expect(scheme.type).toBe('oauth2');
      expect(scheme.name).toBe('OAuth 2.0');
      expect(scheme.flows).toBeDefined();
      const authCodeFlow = scheme.flows!['authorizationCode'];
      expect(authCodeFlow).toBeDefined();
      expect(authCodeFlow!.authorizationUrl).toBe('https://auth.example.com/auth');
      expect(authCodeFlow!.tokenUrl).toBe('https://auth.example.com/token');
      expect(authCodeFlow!.scopes).toEqual({
        openid: 'openid',
        profile: 'profile',
      });
    });

    it('should map awsv4 auth correctly', () => {
      const auth = makeAuth('awsv4', [
        { key: 'accessKey', value: 'AKID123', type: 'string' },
        { key: 'secretKey', value: 'secret', type: 'string' },
        { key: 'service', value: 'execute-api', type: 'string' },
        { key: 'region', value: 'us-east-1', type: 'string' },
      ]);
      const result = mapAuth(auth, undefined, CTX);
      const scheme = result.securitySchemes[0]!;
      expect(scheme.type).toBe('apiKey');
      expect(scheme.name).toBe('AWS Signature (execute-api)');
      expect(scheme.in).toBe('header');
    });

    it('should map awsv4 without service name', () => {
      const auth = makeAuth('awsv4', [{ key: 'accessKey', value: 'AKID123', type: 'string' }]);
      const result = mapAuth(auth, undefined, CTX);
      const scheme = result.securitySchemes[0]!;
      expect(scheme.name).toBe('AWS Signature');
    });
  });

  describe('auth inheritance', () => {
    it('should use item auth when both item and collection auth are present', () => {
      const itemAuth = makeAuth('bearer', [{ key: 'token', value: 'item-token', type: 'string' }]);
      const collectionAuth = makeAuth('basic', [
        { key: 'username', value: 'user', type: 'string' },
        { key: 'password', value: 'pass', type: 'string' },
      ]);
      const result = mapAuth(itemAuth, collectionAuth, CTX);
      expect(result.securitySchemes).toHaveLength(1);
      expect(result.securitySchemes[0]!.type).toBe('http');
      expect(result.securitySchemes[0]!.scheme).toBe('bearer');
    });

    it('should fall back to collection auth when item auth is undefined', () => {
      const collectionAuth = makeAuth('basic', [
        { key: 'username', value: 'admin', type: 'string' },
        { key: 'password', value: 'secret', type: 'string' },
      ]);
      const result = mapAuth(undefined, collectionAuth, CTX);
      expect(result.securitySchemes).toHaveLength(1);
      expect(result.securitySchemes[0]!.scheme).toBe('basic');
    });

    it('should return empty when no auth is provided', () => {
      const result = mapAuth(undefined, undefined, CTX);
      expect(result.securitySchemes).toHaveLength(0);
      expect(result.securityRequirement).toBeUndefined();
    });

    it('should skip auth when item auth is noauth (override collection)', () => {
      const itemAuth = makeAuth('noauth');
      const collectionAuth = makeAuth('basic', [
        { key: 'username', value: 'admin', type: 'string' },
      ]);
      const result = mapAuth(itemAuth, collectionAuth, CTX);
      expect(result.securitySchemes).toHaveLength(0);
      expect(result.securityRequirement).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should emit warning for unsupported auth type', () => {
      const auth = { type: 'unknownType', unknownType: [] } as unknown as PostmanAuth;
      const result = mapAuth(auth, undefined, CTX);
      expect(result.securitySchemes).toHaveLength(0);
      expect(result.diagnostics).toHaveLength(1);
      expect(result.diagnostics[0]!.code).toBe('UNSUPPORTED_AUTH_TYPE');
    });

    it('should handle apikey with default in=header', () => {
      const auth = makeAuth('apikey', [{ key: 'key', value: 'X-Key', type: 'string' }]);
      const result = mapAuth(auth, undefined, CTX);
      expect(result.securitySchemes[0]!.in).toBe('header');
    });

    it('should include sourceLocation on generated scheme', () => {
      const auth = makeAuth('bearer');
      const result = mapAuth(auth, undefined, CTX);
      const scheme = result.securitySchemes[0]!;
      expect(scheme.sourceLocation).toBeDefined();
      expect(scheme.sourceLocation!.sourceId).toBe(CTX.sourceId);
    });
  });
});
