/**
 * @sketch-test/adapter-postman — Folder to workflow hint tests
 *
 * Tests for mapWorkflowHints(): grouping FlatItems by folder
 * path and producing WorkflowHint arrays with ordered steps.
 */

import { describe, expect, it } from 'vitest';
import type { FlatItem } from '../mapper/endpoints.js';
import { mapWorkflowHints } from '../mapper/folders.js';

// ─── Helpers ─────────────────────────────────────────────────────────

function makeItem(name: string, method: string, path: string, folderPath: string): FlatItem {
  return {
    item: {
      name,
      request: {
        method,
        url: { raw: path, path: path.split('/').filter(Boolean) },
      },
    },
    tags: folderPath ? folderPath.split(' / ') : [],
    folderPath,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('mapWorkflowHints', () => {
  it('should group flat items by folder path', () => {
    const items: FlatItem[] = [
      makeItem('Get Users', 'GET', '/users', 'Users'),
      makeItem('Get User', 'GET', '/users/:id', 'Users'),
      makeItem('Create Order', 'POST', '/orders', 'Orders'),
    ];

    const hints = mapWorkflowHints(items);
    expect(hints).toHaveLength(2);

    const usersHint = hints.find((h) => h.name === 'Users');
    const ordersHint = hints.find((h) => h.name === 'Orders');
    expect(usersHint).toBeDefined();
    expect(ordersHint).toBeDefined();
    expect(usersHint!.steps).toEqual(['GET-/users', 'GET-/users/:id']);
    expect(ordersHint!.steps).toEqual(['POST-/orders']);
  });

  it('should preserve endpoint order within each folder', () => {
    const items: FlatItem[] = [
      makeItem('C', 'GET', '/c', 'Folder'),
      makeItem('A', 'GET', '/a', 'Folder'),
      makeItem('B', 'GET', '/b', 'Folder'),
    ];

    const hints = mapWorkflowHints(items);
    expect(hints).toHaveLength(1);
    expect(hints[0]!.steps).toEqual(['GET-/c', 'GET-/a', 'GET-/b']);
  });

  it('should preserve hint order by first appearance', () => {
    const items: FlatItem[] = [
      makeItem('Item 1', 'GET', '/one', 'Z-Folder'),
      makeItem('Item 2', 'GET', '/two', 'A-Folder'),
    ];

    const hints = mapWorkflowHints(items);
    expect(hints).toHaveLength(2);
    expect(hints[0]!.name).toBe('Z-Folder');
    expect(hints[1]!.name).toBe('A-Folder');
  });

  it('should handle nested folder paths', () => {
    const items: FlatItem[] = [
      makeItem('Login', 'POST', '/auth/login', 'Auth / Sessions'),
      makeItem('Register', 'POST', '/auth/register', 'Auth / Sessions'),
      makeItem('Refresh', 'POST', '/auth/refresh', 'Auth / Tokens'),
    ];

    const hints = mapWorkflowHints(items);
    expect(hints).toHaveLength(2);

    const sessionsHint = hints.find((h) => h.name === 'Auth / Sessions');
    const tokensHint = hints.find((h) => h.name === 'Auth / Tokens');
    expect(sessionsHint).toBeDefined();
    expect(tokensHint).toBeDefined();
    expect(sessionsHint!.steps).toEqual(['POST-/auth/login', 'POST-/auth/register']);
    expect(tokensHint!.steps).toEqual(['POST-/auth/refresh']);
  });

  it('should skip items at root level (empty folderPath)', () => {
    const rootItem = makeItem('Root', 'GET', '/', '');
    const folderItem = makeItem('In Folder', 'GET', '/item', 'MyFolder');

    const hints = mapWorkflowHints([rootItem, folderItem]);
    expect(hints).toHaveLength(1);
    expect(hints[0]!.name).toBe('MyFolder');
  });

  it('should skip items without request', () => {
    const items: FlatItem[] = [
      {
        item: { name: 'Folder only (no request)' },
        tags: ['MyFolder'],
        folderPath: 'MyFolder',
      },
      makeItem('Valid', 'GET', '/valid', 'MyFolder'),
    ];

    const hints = mapWorkflowHints(items);
    expect(hints).toHaveLength(1);
    expect(hints[0]!.steps).toEqual(['GET-/valid']);
  });

  it('should return empty array for empty input', () => {
    const hints = mapWorkflowHints([]);
    expect(hints).toHaveLength(0);
  });

  it('should return empty array for root-level items only', () => {
    const items = [makeItem('Item 1', 'GET', '/one', ''), makeItem('Item 2', 'POST', '/two', '')];
    const hints = mapWorkflowHints(items);
    expect(hints).toHaveLength(0);
  });

  it('should handle a single folder with many items', () => {
    const items: FlatItem[] = Array.from({ length: 5 }, (_, i) =>
      makeItem(`Item ${i}`, 'GET', `/item/${i}`, 'SingleFolder'),
    );

    const hints = mapWorkflowHints(items);
    expect(hints).toHaveLength(1);
    expect(hints[0]!.steps).toHaveLength(5);
    expect(hints[0]!.steps[0]).toBe('GET-/item/0');
    expect(hints[0]!.steps[4]).toBe('GET-/item/4');
  });
});
