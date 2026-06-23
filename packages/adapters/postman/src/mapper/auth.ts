/**
 * @sketch-test/adapter-postman — Postman auth mapping
 *
 * Maps Postman Collection authorisation configurations to CanonicalApiModel
 * SecurityScheme objects, with support for auth inheritance (item-level
 * overrides collection-level).
 *
 * Postman auth stores parameters in an array keyed by the auth type name:
 *   { type: "bearer", bearer: [{ key: "token", value: "{{token}}", type: "string" }] }
 *
 * Supported Postman auth types:
 *   noauth, apikey, basic, bearer, digest, hawk, ntlm, oauth1, oauth2, awsv4
 *
 * Invariants:
 *  - noauth produces no security schemes (explicit override)
 *  - Item-level auth always takes precedence over collection-level
 *  - Unrecognised auth types produce a diagnostic warning and are skipped
 *  - Security scheme IDs are deterministic: auth-{type}
 */

import type { ParameterLocation, SecurityScheme } from '@sketch-test/canonical-api-model';
import type { Diagnostic, EntityId, SourceLocation } from '@sketch-test/contracts-common';
import type { PostmanAuth } from '../types.js';
import type { SourceContext } from './shared.js';

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Extract a typed parameter value from a PostmanAuth object.
 *
 * Postman auth parameters are stored in an array under the auth type key:
 *   auth.bearer = [{ key: "token", value: "abc", type: "string" }]
 */
function getAuthParam(auth: PostmanAuth, paramKey: string): string | undefined {
  const params = auth[auth.type];
  if (!Array.isArray(params)) return undefined;
  const entry = (params as Array<{ key: string; value: string; type?: string }>).find(
    (p) => p.key === paramKey,
  );
  return entry?.value;
}

/**
 * Build a SecurityScheme id string.
 */
function schemeId(type: string): EntityId {
  return `auth-${type}` as EntityId;
}

/**
 * Create a SourceLocation from the current context.
 */
function makeSourceLocation(ctx: SourceContext, label: string): SourceLocation {
  return {
    sourceId: ctx.sourceId,
    sourceLabel: ctx.sourceLabel,
    sourceVersion: ctx.sourceVersion,
    sourceHash: ctx.sourceHash,
    location: label,
    ingestedAt: ctx.ingestedAt,
  };
}

// ─── Auth Type Mappers ───────────────────────────────────────────────

interface AuthResult {
  scheme: SecurityScheme;
  requirementKey: string;
}

/** apikey: { key, value, in } → apiKey scheme */
function mapApikey(auth: PostmanAuth, ctx: SourceContext): AuthResult {
  const key = getAuthParam(auth, 'key') || 'api-key';
  const inValue = getAuthParam(auth, 'in') || 'header';
  const inLocation: ParameterLocation = inValue === 'query' ? 'query' : 'header';
  return {
    scheme: {
      id: schemeId('apikey'),
      type: 'apiKey',
      name: key,
      in: inLocation,
      sourceLocation: makeSourceLocation(ctx, 'apikey'),
    },
    requirementKey: 'apikey',
  };
}

/** basic → http basic scheme */
function mapBasic(_auth: PostmanAuth, ctx: SourceContext): AuthResult {
  return {
    scheme: {
      id: schemeId('basic'),
      type: 'http',
      scheme: 'basic',
      name: 'Basic Auth',
      sourceLocation: makeSourceLocation(ctx, 'basic'),
    },
    requirementKey: 'basic',
  };
}

/** bearer → http bearer scheme */
function mapBearer(_auth: PostmanAuth, ctx: SourceContext): AuthResult {
  return {
    scheme: {
      id: schemeId('bearer'),
      type: 'http',
      scheme: 'bearer',
      name: 'Bearer Auth',
      sourceLocation: makeSourceLocation(ctx, 'bearer'),
    },
    requirementKey: 'bearer',
  };
}

/** digest → http digest scheme */
function mapDigest(_auth: PostmanAuth, ctx: SourceContext): AuthResult {
  return {
    scheme: {
      id: schemeId('digest'),
      type: 'http',
      scheme: 'digest',
      name: 'Digest Auth',
      sourceLocation: makeSourceLocation(ctx, 'digest'),
    },
    requirementKey: 'digest',
  };
}

/** hawk → http hawk scheme */
function mapHawk(_auth: PostmanAuth, ctx: SourceContext): AuthResult {
  return {
    scheme: {
      id: schemeId('hawk'),
      type: 'http',
      scheme: 'hawk',
      name: 'Hawk Auth',
      sourceLocation: makeSourceLocation(ctx, 'hawk'),
    },
    requirementKey: 'hawk',
  };
}

/** ntlm → http ntlm scheme */
function mapNtlm(_auth: PostmanAuth, ctx: SourceContext): AuthResult {
  return {
    scheme: {
      id: schemeId('ntlm'),
      type: 'http',
      scheme: 'ntlm',
      name: 'NTLM Auth',
      sourceLocation: makeSourceLocation(ctx, 'ntlm'),
    },
    requirementKey: 'ntlm',
  };
}

/** oauth1 → oauth2 scheme with oauth1 flow */
function mapOauth1(auth: PostmanAuth, ctx: SourceContext): AuthResult {
  const flows: Record<
    string,
    { authorizationUrl?: string; tokenUrl?: string; scopes?: Record<string, string> }
  > = {};
  const consumerKey = getAuthParam(auth, 'consumerKey');
  const token = getAuthParam(auth, 'token');
  const flow: { authorizationUrl?: string; tokenUrl?: string; scopes?: Record<string, string> } =
    {};

  if (consumerKey) flow.authorizationUrl = consumerKey;
  if (token) flow.tokenUrl = token;

  flows['oauth1'] = flow;

  return {
    scheme: {
      id: schemeId('oauth1'),
      type: 'oauth2',
      name: 'OAuth 1.0',
      flows,
      sourceLocation: makeSourceLocation(ctx, 'oauth1'),
    },
    requirementKey: 'oauth1',
  };
}

/** oauth2 → oauth2 scheme with authorizationCode flow */
function mapOauth2(auth: PostmanAuth, ctx: SourceContext): AuthResult {
  const authUrl = getAuthParam(auth, 'authUrl');
  const tokenUrl = getAuthParam(auth, 'tokenUrl');
  const refreshUrl = getAuthParam(auth, 'refreshUrl');
  const scope = getAuthParam(auth, 'scope');

  const scopes: Record<string, string> | undefined = scope
    ? Object.fromEntries(scope.split(/\s+/).map((s) => [s, s]))
    : undefined;

  const flow: {
    authorizationUrl?: string;
    tokenUrl?: string;
    refreshUrl?: string;
    scopes?: Record<string, string>;
  } = {};
  if (authUrl) flow.authorizationUrl = authUrl;
  if (tokenUrl) flow.tokenUrl = tokenUrl;
  if (refreshUrl) flow.refreshUrl = refreshUrl;
  if (scopes && Object.keys(scopes).length > 0) flow.scopes = scopes;

  return {
    scheme: {
      id: schemeId('oauth2'),
      type: 'oauth2',
      name: 'OAuth 2.0',
      flows: { authorizationCode: flow },
      sourceLocation: makeSourceLocation(ctx, 'oauth2'),
    },
    requirementKey: 'oauth2',
  };
}

/** awsv4 → apiKey scheme (AWS Signature V4) */
function mapAwsv4(auth: PostmanAuth, ctx: SourceContext): AuthResult {
  const service = getAuthParam(auth, 'service');
  const name = service ? `AWS Signature (${service})` : 'AWS Signature';

  return {
    scheme: {
      id: schemeId('awsv4'),
      type: 'apiKey',
      name,
      in: 'header',
      sourceLocation: makeSourceLocation(ctx, 'awsv4'),
    },
    requirementKey: 'awsv4',
  };
}

// ─── Auth Router ─────────────────────────────────────────────────────

/** Mapping from Postman auth type to handler. */
const AUTH_HANDLERS: Record<string, (auth: PostmanAuth, ctx: SourceContext) => AuthResult | null> =
  {
    apikey: mapApikey,
    basic: mapBasic,
    bearer: mapBearer,
    digest: mapDigest,
    hawk: mapHawk,
    ntlm: mapNtlm,
    oauth1: mapOauth1,
    oauth2: mapOauth2,
    awsv4: mapAwsv4,
  };

/**
 * Map a single Postman auth object into a SecurityScheme.
 *
 * Returns null if the auth type is 'noauth' or unrecognised.
 */
function mapSingleAuth(
  auth: PostmanAuth,
  ctx: SourceContext,
): { result: AuthResult | null; diagnostics: Diagnostic[] } {
  const diagnostics: Diagnostic[] = [];

  if (auth.type === 'noauth') {
    return { result: null, diagnostics };
  }

  const handler = AUTH_HANDLERS[auth.type];
  if (!handler) {
    diagnostics.push({
      severity: 'warning',
      code: 'UNSUPPORTED_AUTH_TYPE',
      message: `Unsupported auth type "${auth.type}"`,
    });
    return { result: null, diagnostics };
  }

  try {
    const result = handler(auth, ctx);
    return { result, diagnostics };
  } catch (e) {
    diagnostics.push({
      severity: 'warning',
      code: 'AUTH_MAPPING_ERROR',
      message: `Failed to map auth type "${auth.type}": ${e instanceof Error ? e.message : String(e)}`,
    });
    return { result: null, diagnostics };
  }
}

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Map Postman auth (item-level and collection-level) into SecuritySchemes.
 *
 * Auth inheritance:
 *  - If itemAuth is present and is 'noauth', auth is explicitly skipped
 *    (overrides any collection-level auth)
 *  - If itemAuth is present and supported, use itemAuth
 *  - If itemAuth is absent, use collectionAuth if present
 *  - If neither is present, no auth schemes are produced
 *
 * @param itemAuth - Auth defined on the item (higher priority)
 * @param collectionAuth - Auth defined on the collection (fallback)
 * @param ctx - Source context for provenance metadata
 * @returns Security schemes, optional security requirement, and diagnostics
 */
export function mapAuth(
  itemAuth: PostmanAuth | undefined,
  collectionAuth: PostmanAuth | undefined,
  ctx: SourceContext,
): {
  securitySchemes: SecurityScheme[];
  securityRequirement?: Record<string, string[]>;
  diagnostics: Diagnostic[];
} {
  const diagnostics: Diagnostic[] = [];

  // Determine effective auth (item overrides collection)
  const effectiveAuth = itemAuth ?? collectionAuth;
  if (!effectiveAuth) {
    return { securitySchemes: [], diagnostics };
  }

  // Map the effective auth
  const { result, diagnostics: mapDiags } = mapSingleAuth(effectiveAuth, ctx);
  diagnostics.push(...mapDiags);

  if (!result) {
    return { securitySchemes: [], diagnostics };
  }

  const securityRequirement: Record<string, string[]> = {
    [result.requirementKey]: [],
  };

  return {
    securitySchemes: [result.scheme],
    securityRequirement,
    diagnostics,
  };
}
