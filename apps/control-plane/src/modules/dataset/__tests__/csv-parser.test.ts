/**
 * CSV Parser unit tests.
 *
 * Tests CSV parsing via importDatasetFromCsv — exercises the private parseCsv,
 * splitCsvLines, and parseCsvLine functions through the public API.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';

// ─── Mock pool and id ─────────────────────────────────────────────

const mockQuery = vi.fn();

vi.mock('../../../db/db.js', () => ({
  pool: {
    query: (...args: unknown[]) => mockQuery(...args),
  },
}));

vi.mock('../../../shared/id.js', () => {
  let counter = 0;
  return {
    datasetId: () => `ds-${++counter}`,
    datasetVersionId: () => `dsv-${++counter}`,
  };
});

import { importDatasetFromCsv } from '../dataset.service';

// ─── Setup helpers ─────────────────────────────────────────────────

/**
 * Set up DB mocks for a successful importDatasetFromCsv call.
 *
 * importDatasetFromCsv internally:
 * 1. Calls createDataset → INSERT INTO datasets → needs 1 mock return
 * 2. Calls createDatasetVersion → SELECT dataset (getDataset) → needs 1 mock return
 * 3. Calls createDatasetVersion → SELECT MAX(version) → needs 1 mock return
 * 4. Calls createDatasetVersion → INSERT INTO dataset_versions → needs 1 mock return
 */
function mockDbForImport() {
  mockQuery
    .mockResolvedValueOnce({ rows: [] }) // INSERT dataset (createDataset)
    .mockResolvedValueOnce({
      rows: [
        {
          id: 'ds-1',
          workspace_id: 'ws-1',
          name: 'test',
          description: '',
          created_at: '2026-01-01',
        },
      ],
    }) // getDataset check
    .mockResolvedValueOnce({ rows: [] }) // SELECT latest version (MAX)
    .mockResolvedValueOnce({ rows: [] }); // INSERT dataset_versions
}

// ─── Tests ─────────────────────────────────────────────────────────

describe('importDatasetFromCsv', () => {
  afterEach(() => {
    mockQuery.mockReset();
  });

  test('parses simple CSV with single row', async () => {
    mockDbForImport();
    const csv = 'name,age,city\nAlice,30,NYC';

    const result = await importDatasetFromCsv('ws-1', 'users', csv);

    expect(result.dataset.name).toBe('users');
    expect(result.version.rows).toHaveLength(1);
    expect(result.version.rows[0]).toEqual({ name: 'Alice', age: '30', city: 'NYC' });
  });

  test('parses CSV with multiple rows', async () => {
    mockDbForImport();
    const csv = 'id,name\n1,Alice\n2,Bob\n3,Charlie\n4,Diana\n5,Eve';

    const result = await importDatasetFromCsv('ws-1', 'team', csv);

    expect(result.version.rows).toHaveLength(5);
    expect(result.version.rows[0]).toEqual({ id: '1', name: 'Alice' });
    expect(result.version.rows[4]).toEqual({ id: '5', name: 'Eve' });
  });

  test('parses CSV with quoted fields containing commas', async () => {
    mockDbForImport();
    const csv = 'name,address\nAlice,"123 Main St, Apt 4B"\nBob,"456 Oak Ave, Suite 7"';

    const result = await importDatasetFromCsv('ws-1', 'addresses', csv);

    expect(result.version.rows[0]!['address']).toBe('123 Main St, Apt 4B');
    expect(result.version.rows[1]!['address']).toBe('456 Oak Ave, Suite 7');
  });

  test('parses CSV with escaped quotes ("" → ")', async () => {
    mockDbForImport();
    const csv = 'name,quote\nAlice,"She said ""Hello"""\nBob,"""Goodbye"" he replied"';

    const result = await importDatasetFromCsv('ws-1', 'quotes', csv);

    expect(result.version.rows[0]!['quote']).toBe('She said "Hello"');
    expect(result.version.rows[1]!['quote']).toBe('"Goodbye" he replied');
  });

  test('trims whitespace outside quotes', async () => {
    mockDbForImport();
    const csv = ' name , age \n Alice , 30 ';

    const result = await importDatasetFromCsv('ws-1', 'trimmed', csv);

    expect(result.version.rows[0]!['name']).toBe('Alice');
    expect(result.version.rows[0]!['age']).toBe('30');
  });

  test('skips empty lines', async () => {
    mockDbForImport();
    const csv = 'name,age\n\nAlice,30\n\n\nBob,40\n';

    const result = await importDatasetFromCsv('ws-1', 'noempty', csv);

    expect(result.version.rows).toHaveLength(2);
  });

  test('handles single-column CSV', async () => {
    mockDbForImport();
    const csv = 'value\none\ntwo\nthree';

    const result = await importDatasetFromCsv('ws-1', 'singlecol', csv);

    expect(result.version.rows).toHaveLength(3);
    expect(result.version.rows[0]).toEqual({ value: 'one' });
  });

  test('pads missing columns with empty string', async () => {
    mockDbForImport();
    const csv = 'a,b,c\n1,2';

    const result = await importDatasetFromCsv('ws-1', 'sparse', csv);

    expect(result.version.rows[0]!['a']).toBe('1');
    expect(result.version.rows[0]!['b']).toBe('2');
    expect(result.version.rows[0]!['c']).toBe('');
  });

  test('rejects empty CSV', async () => {
    await expect(importDatasetFromCsv('ws-1', 'empty', '')).rejects.toThrow('header');
  });

  test('rejects CSV with only whitespace', async () => {
    await expect(importDatasetFromCsv('ws-1', 'whitespace', '   \n  \n  ')).rejects.toThrow(
      'header',
    );
  });

  test('handles CSV with Windows-style line endings', async () => {
    mockDbForImport();
    const csv = 'name,age\r\nAlice,30\r\nBob,40';

    const result = await importDatasetFromCsv('ws-1', 'windows', csv);

    expect(result.version.rows).toHaveLength(2);
    expect(result.version.rows[0]!['name']).toBe('Alice');
  });

  test('handles CSV with numeric-looking values (stored as strings)', async () => {
    mockDbForImport();
    const csv = 'id,score\n1,95.5\n2,100\n3,87.3';

    const result = await importDatasetFromCsv('ws-1', 'scores', csv);

    expect(result.version.rows[0]!['score']).toBe('95.5');
    expect(typeof result.version.rows[0]!['score']).toBe('string');
  });

  test('handles CSV with special characters in headers', async () => {
    mockDbForImport();
    const csv = 'user_id,first-name,email@domain\n1,Alice,alice@test.com';

    const result = await importDatasetFromCsv('ws-1', 'special', csv);

    expect(result.version.rows[0]!['user_id']).toBe('1');
    expect(result.version.rows[0]!['first-name']).toBe('Alice');
    expect(result.version.rows[0]!['email@domain']).toBe('alice@test.com');
  });

  test('handles CSV with trailing comma in unquoted field', async () => {
    mockDbForImport();
    const csv = 'a,b\nhello';

    const result = await importDatasetFromCsv('ws-1', 'trailing', csv);

    expect(result.version.rows[0]!['a']).toBe('hello');
    expect(result.version.rows[0]!['b']).toBe('');
  });

  test('version auto-increments correctly', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] }) // INSERT dataset
      .mockResolvedValueOnce({ rows: [{ id: 'ds-1', workspace_id: 'ws-1', name: 'test' }] }) // getDataset
      .mockResolvedValueOnce({ rows: [{ version: 3 }] }) // MAX version = 3
      .mockResolvedValueOnce({ rows: [] }); // INSERT version

    const csv = 'name\nAlice';
    const result = await importDatasetFromCsv('ws-1', 'versioned', csv);

    expect(result.version.version).toBe(4);
  });
});
