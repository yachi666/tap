/**
 * @sketch-test/adapter-postman — Postman test script regex patterns
 *
 * Regex patterns for matching common Postman test script assertion calls.
 * Each pattern maps to a canonical AssertionPattern object in the mapper.
 *
 * Patterns cover the 11 recognized assertion forms:
 *  - Status code exact match (pm.response.to.have.status)
 *  - Status range shortcuts (.ok, .accepted, .clientError)
 *  - Header value check (.to.have.header)
 *  - Latency threshold (.responseTime.to.be.below)
 *  - JSON body existence (.to.have.jsonBody)
 *  - JSON body value equality (pm.expect(jsonData.X).to.eql)
 *  - Property existence (pm.expect(X).to.have.property)
 *  - Body text match (.to.have.body)
 *  - Content-type JSON check (.to.be.json)
 *
 * Invariants:
 *  - All patterns match only on trimmed lines
 *  - Patterns avoid false-positives on similar method chains
 *  - Only the 'test' event listener assertions are matched
 */

/** pm.response.to.have.status(200) — exact status code match */
export const STATUS_CODE_PATTERN = /pm\.response\.to\.have\.status\((\d+)\)/;

/** pm.response.to.be.ok — status in 2xx range */
export const STATUS_OK_PATTERN = /pm\.response\.to\.be\.ok/;

/** pm.response.to.be.accepted — status equals 202 */
export const STATUS_ACCEPTED_PATTERN = /pm\.response\.to\.be\.accepted/;

/** pm.response.to.be.clientError — status in 4xx range */
export const STATUS_CLIENT_ERROR_PATTERN = /pm\.response\.to\.be\.clientError/;

/** pm.response.to.have.header("X-My-Header", "expected-value") */
export const HEADER_PATTERN =
  /pm\.response\.to\.have\.header\(["']([^"']+)["']\s*,\s*["']([^"']+)["']\)/;

/** pm.expect(pm.response.responseTime).to.be.below(200) */
export const LATENCY_PATTERN = /pm\.expect\(pm\.response\.responseTime\)\.to\.be\.below\((\d+)\)/;

/** pm.response.to.have.jsonBody("data.items") */
export const JSON_BODY_PATTERN = /pm\.response\.to\.have\.jsonBody\(["']([^"']+)["']\)/;

/** pm.expect(jsonData.data.user.name).to.eql("Alice") */
export const EQL_PATTERN =
  /pm\.expect\(jsonData\.([a-zA-Z_$][a-zA-Z0-9_$.]*(?:\[(?:\d+|["'][^"']+["'])\])*)\)\.to\.eql\(["']([^"']+)["']\)/;

/** pm.expect(responseBody).to.have.property("id")  or  pm.expect(jsonData).to.have.property("key") */
export const PROPERTY_PATTERN = /pm\.expect\([^)]+\)\.to\.have\.property\(["']([^"']+)["']\)/;

/** pm.response.to.have.body("response body text") */
export const BODY_TEXT_PATTERN = /pm\.response\.to\.have\.body\(["']([^"']+)["']\)/;

/** pm.response.to.be.json */
export const IS_JSON_PATTERN = /pm\.response\.to\.be\.json/;
