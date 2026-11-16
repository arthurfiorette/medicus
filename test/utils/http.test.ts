import assert from 'node:assert';
import { describe, it } from 'node:test';
import { createHealthCheckHeaders, parseQueryFlag } from '../../src/utils/http';

describe('HTTP utilities', () => {
  it('overrides default headers case-insensitively', () => {
    const headers = createHealthCheckHeaders({ 'Cache-Control': 'public, max-age=30' });

    assert.deepEqual(headers, {
      'cache-control': 'public, max-age=30',
      'content-type': 'application/json; charset=utf-8'
    });
  });

  it('parses query flags', () => {
    const cases: [unknown, boolean][] = [
      ['', true],
      ['true', true],
      ['1', true],
      ['false', false],
      ['0', false],
      [null, false],
      [undefined, false],
      [['true', 'false'], false]
    ];

    for (const [value, expected] of cases) {
      assert.equal(parseQueryFlag(value), expected, `parseQueryFlag(${JSON.stringify(value)})`);
    }
  });
});
