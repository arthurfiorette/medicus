import assert from 'node:assert';
import { describe, it } from 'node:test';
import type { H3Event } from 'h3' with { 'resolution-mode': 'import' };
import { HealthStatus } from '../../src';
import { createH3HealthCheckHandler } from '../../src/integrations/h3';

describe('H3 Integration', async () => {
  // h3 2 is ESM-only and this test file compiles to CommonJS
  const { H3 } = await import('h3');

  it('handles H3 requests and passes the event to checkers', async () => {
    const handler = createH3HealthCheckHandler({
      debug: true,
      headers: { 'x-health': 'medicus' },
      checkers: {
        request(event) {
          return {
            status: HealthStatus.HEALTHY,
            debug: { path: event.url.pathname }
          };
        }
      }
    });
    const app = new H3().get('/health', handler);

    const response = await app.request('/health');
    const body: any = await response.json();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-cache, no-store, must-revalidate');
    assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');
    assert.equal(response.headers.get('x-health'), 'medicus');
    assert.equal(body.services.request.debug.path, '/health');
  });

  it('supports cached and simulated results', async () => {
    let calls = 0;
    const handler = createH3HealthCheckHandler({
      checkers: {
        service() {
          calls++;
          return HealthStatus.HEALTHY;
        }
      }
    });
    const app = new H3().get('/health', handler);

    await app.request('/health');
    await app.request('/health?last=true');
    const simulated = await app.request('/health?simulate=unhealthy&last=false');

    assert.equal(calls, 2);
    assert.equal(simulated.status, 503);
  });

  it('reads the query string from H3 1 events', async () => {
    const handler = createH3HealthCheckHandler();

    // H3 1 (Nitro 2) events have no `url`, only `path` with the query string
    const response = await handler({ path: '/health?simulate=unhealthy' } as unknown as H3Event);

    assert.equal(response.status, 503);
  });
});
