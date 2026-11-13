import assert from 'node:assert';
import { describe, it } from 'node:test';
import { createHealthCheckHeaders, DefaultHealthCheckHeaders } from '../../src/utils/http';

describe('HTTP utilities', () => {
  it('creates fresh default health check headers', () => {
    const headers = createHealthCheckHeaders();

    assert.deepEqual(headers, DefaultHealthCheckHeaders);
    assert.notStrictEqual(headers, DefaultHealthCheckHeaders);
  });

  it('overrides headers case-insensitively', () => {
    const headers = createHealthCheckHeaders({
      'Cache-Control': 'public, max-age=30',
      'Content-Type': 'application/health+json'
    });

    assert.equal(headers['cache-control'], 'public, max-age=30');
    assert.equal(headers['content-type'], 'application/health+json');
    assert.equal(Object.keys(headers).length, 2);
  });
});
