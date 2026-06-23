/**
 * @sketch-test/adapter-postman — Internal Postman types
 *
 * Postman Collection v2.1 — internal types for parsing (subset we map).
 *
 * These types represent the JSON structure of a Postman Collection v2.1
 * export and a Postman Environment export. They are internal to the
 * adapter and should never appear in public APIs.
 *
 * Schema version: Postman Collection v2.1.0
 * Specification: https://schema.getpostman.com/json/collection/v2.1.0/
 */

/** Postman Collection v2.1 document */
export interface PostmanCollection {
  info: {
    name: string;
    schema: string;
    description?: string;
    version?: string;
    _postman_id?: string;
  };
  item: PostmanItem[];
  auth?: PostmanAuth;
  variable?: PostmanVariable[];
  event?: PostmanEvent[];
}

/** An item (request or folder) within a collection */
export interface PostmanItem {
  name: string;
  request?: PostmanRequest;
  response?: PostmanResponse[];
  item?: PostmanItem[];
  event?: PostmanEvent[];
  auth?: PostmanAuth;
  variable?: PostmanVariable[];
  description?: string;
}

/** A Postman request */
export interface PostmanRequest {
  method: string;
  url: PostmanUrl | string;
  header?: PostmanHeader[];
  body?: PostmanBody;
  description?: string;
  auth?: PostmanAuth;
}

/** A Postman URL object */
export interface PostmanUrl {
  raw: string;
  protocol?: string;
  host?: string[];
  port?: string;
  path?: string[];
  query?: Array<{
    key: string;
    value: string;
    disabled?: boolean;
    description?: string;
  }>;
  variable?: Array<{
    key: string;
    value: string;
    description?: string;
  }>;
}

/** An HTTP header */
export interface PostmanHeader {
  key: string;
  value: string;
  disabled?: boolean;
  description?: string;
}

/** A request body configuration */
export interface PostmanBody {
  mode: 'raw' | 'urlencoded' | 'formdata' | 'file' | 'graphql' | 'none';
  raw?: string;
  urlencoded?: PostmanHeader[];
  formdata?: PostmanHeader[];
  graphql?: Record<string, unknown>;
  options?: Record<string, unknown>;
}

/** A stored response example */
export interface PostmanResponse {
  name?: string;
  status: string;
  code: number;
  header?: PostmanHeader[];
  body?: string;
  responseTime?: number;
  originalRequest?: PostmanRequest;
}

/** Authentication configuration */
export interface PostmanAuth {
  type: string;
  [key: string]: unknown; // auth params vary by type
}

/** A collection or environment variable */
export interface PostmanVariable {
  key: string;
  value: string;
  type?: string;
  description?: string;
  disabled?: boolean;
}

/** A pre-request or test script event */
export interface PostmanEvent {
  listen: 'test' | 'prerequest';
  script: {
    exec?: string[];
    type?: string;
    src?: string;
  };
  disabled?: boolean;
}

/** Postman Environment */
export interface PostmanEnvironment {
  id?: string;
  name: string;
  values: PostmanVariable[];
  _postman_variable_scope?: string;
  _exporter_id?: string;
  _exporter_variable_scope?: string;
}
