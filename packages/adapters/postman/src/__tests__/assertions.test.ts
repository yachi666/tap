/**
 * @sketch-test/adapter-postman — Script assertion extraction tests
 *
 * Tests for extractAssertions(): pattern matching of common Postman test
 * script calls (pm.test / pm.expect) into structured AssertionPattern objects.
 */

import { describe, expect, it } from 'vitest';
import { extractAssertions } from '../mapper/assertions.js';
import type { PostmanEvent } from '../types.js';

// ─── Helpers ─────────────────────────────────────────────────────────

function makeTestEvent(lines: string[]): PostmanEvent {
  return {
    listen: 'test',
    script: {
      exec: lines,
      type: 'text/javascript',
    },
  };
}

function makePrerequestEvent(lines: string[]): PostmanEvent {
  return {
    listen: 'prerequest',
    script: {
      exec: lines,
      type: 'text/javascript',
    },
  };
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('extractAssertions', () => {
  describe('recognised patterns', () => {
    it('should match pm.response.to.have.status(N) -> status equals', () => {
      const events = [
        makeTestEvent(['pm.test("Status code", () => { pm.response.to.have.status(200); });']),
      ];
      const result = extractAssertions(events);
      expect(result.assertions).toHaveLength(1);
      expect(result.assertions[0]).toEqual({ type: 'status', equals: 200 });
    });

    it('should match pm.response.to.be.ok -> 2xx range', () => {
      const events = [makeTestEvent(['pm.test("OK", () => { pm.response.to.be.ok; });'])];
      const result = extractAssertions(events);
      expect(result.assertions).toHaveLength(1);
      expect(result.assertions[0]).toEqual({ type: 'status', range: '2xx' });
    });

    it('should match pm.response.to.be.accepted -> status 202', () => {
      const events = [
        makeTestEvent(['pm.test("Accepted", () => { pm.response.to.be.accepted; });']),
      ];
      const result = extractAssertions(events);
      expect(result.assertions).toHaveLength(1);
      expect(result.assertions[0]).toEqual({ type: 'status', equals: 202 });
    });

    it('should match pm.response.to.be.clientError -> 4xx range', () => {
      const events = [
        makeTestEvent(['pm.test("Client error", () => { pm.response.to.be.clientError; });']),
      ];
      const result = extractAssertions(events);
      expect(result.assertions).toHaveLength(1);
      expect(result.assertions[0]).toEqual({ type: 'status', range: '4xx' });
    });

    it('should match pm.response.to.have.header("X", "Y") -> header assertion', () => {
      const events = [
        makeTestEvent([
          'pm.test("Header", () => { pm.response.to.have.header("Content-Type", "application/json"); });',
        ]),
      ];
      const result = extractAssertions(events);
      expect(result.assertions).toHaveLength(1);
      expect(result.assertions[0]).toEqual({
        type: 'header',
        name: 'Content-Type',
        value: 'application/json',
      });
    });

    it('should match header with single quotes', () => {
      const events = [
        makeTestEvent([
          "pm.test('Header', () => { pm.response.to.have.header('X-Custom', 'val'); });",
        ]),
      ];
      const result = extractAssertions(events);
      expect(result.assertions[0]).toEqual({ type: 'header', name: 'X-Custom', value: 'val' });
    });

    it('should match pm.expect(pm.response.responseTime).to.be.below(N) -> latency', () => {
      const events = [
        makeTestEvent([
          'pm.test("Latency", () => { pm.expect(pm.response.responseTime).to.be.below(200); });',
        ]),
      ];
      const result = extractAssertions(events);
      expect(result.assertions).toHaveLength(1);
      expect(result.assertions[0]).toEqual({ type: 'latency', max: 200 });
    });

    it('should match pm.response.to.have.jsonBody("key") -> body exist', () => {
      const events = [
        makeTestEvent(['pm.test("Has body", () => { pm.response.to.have.jsonBody("data"); });']),
      ];
      const result = extractAssertions(events);
      expect(result.assertions).toHaveLength(1);
      expect(result.assertions[0]).toEqual({ type: 'body', jsonPath: '$.data', exists: true });
    });

    it('should match pm.expect(jsonData.key).to.eql("value") -> body equals', () => {
      const events = [
        makeTestEvent(['pm.test("Equals", () => { pm.expect(jsonData.name).to.eql("Alice"); });']),
      ];
      const result = extractAssertions(events);
      expect(result.assertions).toHaveLength(1);
      expect(result.assertions[0]).toEqual({ type: 'body', jsonPath: '$.name', equals: 'Alice' });
    });

    it('should match nested jsonData path', () => {
      const events = [makeTestEvent(['pm.expect(jsonData.user.address.city).to.eql("NYC");'])];
      const result = extractAssertions(events);
      expect(result.assertions).toHaveLength(1);
      expect(result.assertions[0]).toEqual({
        type: 'body',
        jsonPath: '$.user.address.city',
        equals: 'NYC',
      });
    });

    it('should match pm.expect(...).to.have.property("key") -> body exists', () => {
      const events = [
        makeTestEvent([
          'pm.test("Property", () => { pm.expect(responseBody).to.have.property("id"); });',
        ]),
      ];
      const result = extractAssertions(events);
      expect(result.assertions).toHaveLength(1);
      expect(result.assertions[0]).toEqual({ type: 'body', jsonPath: '$.id', exists: true });
    });

    it('should match pm.response.to.have.body("text") -> body contains', () => {
      const events = [
        makeTestEvent([
          'pm.test("Body text", () => { pm.response.to.have.body("Hello World"); });',
        ]),
      ];
      const result = extractAssertions(events);
      expect(result.assertions).toHaveLength(1);
      expect(result.assertions[0]).toEqual({ type: 'body', contains: 'Hello World' });
    });

    it('should match pm.response.to.be.json -> contentType isJson', () => {
      const events = [makeTestEvent(['pm.test("Is JSON", () => { pm.response.to.be.json; });'])];
      const result = extractAssertions(events);
      expect(result.assertions).toHaveLength(1);
      expect(result.assertions[0]).toEqual({ type: 'contentType', isJson: true });
    });
  });

  describe('multiple patterns in one script', () => {
    it('should extract all recognised patterns from a multi-line script', () => {
      const lines = [
        'pm.test("Status", () => { pm.response.to.have.status(200); });',
        'pm.test("JSON", () => { pm.response.to.be.json; });',
        'pm.test("Latency", () => { pm.expect(pm.response.responseTime).to.be.below(500); });',
      ];
      const events = [makeTestEvent(lines)];
      const result = extractAssertions(events);
      expect(result.assertions).toHaveLength(3);
      expect(result.assertions[0]).toEqual({ type: 'status', equals: 200 });
      expect(result.assertions[1]).toEqual({ type: 'contentType', isJson: true });
      expect(result.assertions[2]).toEqual({ type: 'latency', max: 500 });
    });
  });

  describe('unrecognised scripts', () => {
    it('should preserve unrecognised lines in rawScripts', () => {
      const events = [
        makeTestEvent([
          'pm.test("Custom", () => { pm.variables.set("x", 1); });',
          'console.log("debug");',
        ]),
      ];
      const result = extractAssertions(events);
      expect(result.assertions).toHaveLength(0);
      expect(result.rawScripts).toHaveLength(2);
      expect(result.rawScripts[0]).toContain('pm.variables.set');
      expect(result.rawScripts[1]).toContain('console.log');
    });

    it('should mix recognised and unrecognised lines', () => {
      const events = [
        makeTestEvent([
          'pm.test("Status", () => { pm.response.to.have.status(200); });',
          'const custom = "some logic";',
        ]),
      ];
      const result = extractAssertions(events);
      expect(result.assertions).toHaveLength(1);
      expect(result.assertions[0]).toEqual({ type: 'status', equals: 200 });
      expect(result.rawScripts).toHaveLength(1);
      expect(result.rawScripts[0]).toContain('custom');
    });
  });

  describe('edge cases', () => {
    it('should return empty result for undefined events', () => {
      const result = extractAssertions(undefined);
      expect(result.assertions).toHaveLength(0);
      expect(result.rawScripts).toHaveLength(0);
    });

    it('should return empty result for empty events', () => {
      const result = extractAssertions([]);
      expect(result.assertions).toHaveLength(0);
      expect(result.rawScripts).toHaveLength(0);
    });

    it('should skip disabled events', () => {
      const event: PostmanEvent = {
        listen: 'test',
        script: { exec: ['pm.response.to.have.status(200);'], type: 'text/javascript' },
        disabled: true,
      };
      const result = extractAssertions([event]);
      expect(result.assertions).toHaveLength(0);
    });

    it('should skip prerequest events', () => {
      const events = [makePrerequestEvent(['pm.response.to.have.status(200);'])];
      const result = extractAssertions(events);
      expect(result.assertions).toHaveLength(0);
    });

    it('should handle events with no script exec lines', () => {
      const event: PostmanEvent = {
        listen: 'test',
        script: { type: 'text/javascript' },
      };
      const result = extractAssertions([event]);
      expect(result.assertions).toHaveLength(0);
      expect(result.rawScripts).toHaveLength(0);
    });

    it('should handle empty script exec array', () => {
      const events = [makeTestEvent([])];
      const result = extractAssertions(events);
      expect(result.assertions).toHaveLength(0);
      expect(result.rawScripts).toHaveLength(0);
    });

    it('should handle multiple test events across items', () => {
      const events = [
        makeTestEvent(['pm.response.to.have.status(200);']),
        makeTestEvent(['pm.response.to.be.json;']),
      ];
      const result = extractAssertions(events);
      expect(result.assertions).toHaveLength(2);
    });

    it('should handle whitespace-only lines (skip matching)', () => {
      const events = [makeTestEvent(['', '   ', 'pm.response.to.have.status(200);'])];
      const result = extractAssertions(events);
      // Empty and whitespace-only lines don't match and go to rawScripts
      expect(result.assertions).toHaveLength(1);
      expect(result.rawScripts).toHaveLength(2);
    });
  });
});
