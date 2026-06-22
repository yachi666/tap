/**
 * @sketch-test/contracts-common — Shared types for all SketchTest contracts.
 *
 * These types are the vocabulary of the platform: traceability, versioning,
 * diagnostics, and security classifications. Every contract package builds
 * on these primitives.
 */
import { z } from 'zod';

// ─── Identifiers ───────────────────────────────────────────────

/** Stable, URL-safe identifier used across all SketchTest entities. */
/** Stable, URL-safe identifier. Allows alphanumeric, hyphen, underscore, dot, slash, colon (for path params), and braces. */
export const EntityIdSchema = z
  .string()
  .min(1)
  .max(256)
  .regex(/^[a-zA-Z0-9_\-/.:{}]+$/);
export type EntityId = z.infer<typeof EntityIdSchema>;

/** SHA-256 content hash as hex string. */
export const ContentHashSchema = z
  .string()
  .length(64)
  .regex(/^[0-9a-f]{64}$/);
export type ContentHash = z.infer<typeof ContentHashSchema>;

/** Semantic version string, e.g. "1.2.3". */
export const SemanticVersionSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$/);
export type SemanticVersion = z.infer<typeof SemanticVersionSchema>;

// ─── Timestamps ─────────────────────────────────────────────────

/** ISO-8601 instant in UTC, with required timezone. */
export const InstantSchema = z.string().datetime({ offset: true });
export type Instant = z.infer<typeof InstantSchema>;

// ─── Source Traceability ────────────────────────────────────────

/**
 * Every generated artifact must carry its origin. This is the foundation
 * of the "evidence-first" product principle.
 */
export const SourceLocationSchema = z.object({
  /** Stable reference to the source document or repository. */
  sourceId: EntityIdSchema,
  /** Human-readable source label, e.g. "openapi.yaml" or "OrderController.ts". */
  sourceLabel: z.string().min(1).max(256),
  /** Version of the source at time of generation. */
  sourceVersion: SemanticVersionSchema,
  /** Content hash of the source at time of generation. */
  sourceHash: ContentHashSchema,
  /** Line / path within the source, if applicable. */
  location: z.string().max(512).optional(),
  /** When the source was ingested or analyzed. */
  ingestedAt: InstantSchema,
});
export type SourceLocation = z.infer<typeof SourceLocationSchema>;

// ─── Parse Diagnostics ──────────────────────────────────────────

export const DiagnosticSeveritySchema = z.enum(['error', 'warning', 'info', 'hint']);
export type DiagnosticSeverity = z.infer<typeof DiagnosticSeveritySchema>;

export const DiagnosticSchema = z.object({
  severity: DiagnosticSeveritySchema,
  code: z.string().min(1).max(64),
  message: z.string().min(1).max(1024),
  /** Path within the source document, e.g. "$.paths./users.post". */
  path: z.string().max(512).optional(),
  /** Source location that produced this diagnostic. */
  sourceLocation: SourceLocationSchema.optional(),
});
export type Diagnostic = z.infer<typeof DiagnosticSchema>;

// ─── Side Effect Classification ─────────────────────────────────

/**
 * Every test step must declare its side-effect level. The platform uses
 * this to enforce production safety policies.
 */
export const SideEffectLevelSchema = z.enum([
  /** No side effects; safe to run repeatedly in any environment. */
  'read-only',
  /** Writes data but has a corresponding cleanup step. */
  'cleanup-required',
  /** Writes data that cannot be automatically cleaned up. */
  'irreversible',
  /** Sends notifications, triggers payments, or modifies external systems. */
  'high-risk',
]);
export type SideEffectLevel = z.infer<typeof SideEffectLevelSchema>;

// ─── Confidence ─────────────────────────────────────────────────

/** Confidence level for AI-generated or inferred content. */
export const ConfidenceLevelSchema = z.enum(['certain', 'high', 'medium', 'low', 'inferred']);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;

// ─── HTTP Semantics ─────────────────────────────────────────────

export const HttpMethodSchema = z.enum([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
]);
export type HttpMethod = z.infer<typeof HttpMethodSchema>;

export const MediaTypeSchema = z.string().min(1).max(256);
export type MediaType = z.infer<typeof MediaTypeSchema>;

/** Knowable HTTP status codes used in assertions and generation. */
export const HttpStatusCodeSchema = z.union([
  z.literal(200),
  z.literal(201),
  z.literal(204),
  z.literal(301),
  z.literal(302),
  z.literal(400),
  z.literal(401),
  z.literal(403),
  z.literal(404),
  z.literal(405),
  z.literal(409),
  z.literal(422),
  z.literal(429),
  z.literal(500),
  z.literal(502),
  z.literal(503),
  z.number().int().min(100).max(599),
]);
export type HttpStatusCode = z.infer<typeof HttpStatusCodeSchema>;

// ─── Immutable Version Pattern ──────────────────────────────────

/**
 * Every canonical entity (API version, test case version, workflow version,
 * environment version) is immutable once published. This base type captures
 * the common fields.
 */
export const ImmutableVersionMetaSchema = z.object({
  /** Unique identifier for this version. */
  id: EntityIdSchema,
  /** Parent entity identifier (e.g., test case id). */
  entityId: EntityIdSchema,
  /** Monotonically increasing version number. */
  version: z.number().int().positive(),
  /** When this version was published. */
  publishedAt: InstantSchema,
  /** Who published this version. */
  publishedBy: z.string().min(1).max(128),
  /** Optional label, e.g. "v1.0.0" or "draft-3". */
  label: z.string().max(128).optional(),
  /** Content hash of the version payload. */
  contentHash: ContentHashSchema,
});
export type ImmutableVersionMeta = z.infer<typeof ImmutableVersionMetaSchema>;

// ─── Variable Reference ─────────────────────────────────────────

/**
 * Variables in SketchTest have three scopes: step, workflow, and environment.
 * References are resolved at compile time (scope + name) and at runtime (value).
 */
export const VariableScopeSchema = z.enum(['step', 'workflow', 'environment', 'secret']);
export type VariableScope = z.infer<typeof VariableScopeSchema>;

export const VariableRefSchema = z.object({
  name: z.string().min(1).max(128),
  scope: VariableScopeSchema,
  /** JSONPath or regex expression used to extract the value. */
  extractFrom: z.string().max(1024).optional(),
  /** Whether this variable contains sensitive data. */
  sensitive: z.boolean().default(false),
});
export type VariableRef = z.infer<typeof VariableRefSchema>;

// ─── Pagination ─────────────────────────────────────────────────

export const CursorPaginationSchema = z.object({
  cursor: z.string().max(256).optional(),
  limit: z.number().int().min(1).max(200).default(50),
});
export type CursorPagination = z.infer<typeof CursorPaginationSchema>;

export const PaginatedResultSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    nextCursor: z.string().max(256).nullable(),
    total: z.number().int().nonnegative().optional(),
  });

// ─── Error Response ─────────────────────────────────────────────

export const ApiErrorResponseSchema = z.object({
  code: z.string().min(1).max(64),
  message: z.string().min(1).max(1024),
  fieldProblems: z
    .array(
      z.object({
        field: z.string().max(256),
        message: z.string().max(512),
      }),
    )
    .optional(),
  correlationId: z.string().max(64),
});
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
