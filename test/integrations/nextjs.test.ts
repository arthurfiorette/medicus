import assert from 'node:assert';
import { createServer } from 'node:http';
import { describe, it } from 'node:test';
import { HealthStatus } from '../../src';
import {
  createNextHealthCheckHandler,
  createNextPagesHealthCheckHandler
} from '../../src/integrations/nextjs';

describe('Next.js Integration', () => {
  it('handles App Router requests and passes the request to checkers', async () => {
    const handler = createNextHealthCheckHandler({
      debug: true,
      headers: { 'x-health': 'medicus' },
      checkers: {
        request(req) {
          return {
            status: HealthStatus.HEALTHY,
            debug: { path: new URL(req.url).pathname }
          };
        }
      }
    });

    const response = await handler(new Request('http://localhost/health'));
    const body: any = await response.json();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-cache, no-store, must-revalidate');
    assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');
    assert.equal(response.headers.get('x-health'), 'medicus');
    assert.equal(body.services.request.debug.path, '/health');
  });

  it('does not let ?debug bypass a debug detector', async () => {
    const handler = createNextHealthCheckHandler({
      debug: (req) => req.headers.get('authorization') === 'Bearer secret',
      checkers: {
        service: () => ({ status: HealthStatus.HEALTHY, debug: { secret: 'value' } })
      }
    });

    const anonymous = await handler(new Request('http://localhost/health?debug=true'));
    const authorized = await handler(
      new Request('http://localhost/health', { headers: { authorization: 'Bearer secret' } })
    );

    assert.deepEqual(await anonymous.json(), { status: HealthStatus.HEALTHY, services: {} });
    assert.equal(((await authorized.json()) as any).services.service.debug.secret, 'value');
  });

  it('handles Pages Router requests', async () => {
    let calls = 0;
    const handler = createNextPagesHealthCheckHandler({
      checkers: {
        service() {
          calls++;
          return HealthStatus.HEALTHY;
        }
      }
    });

    await using server = createServer(handler).listen(0);
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const url = `http://127.0.0.1:${address.port}/api/health`;

    await fetch(url);
    await fetch(`${url}?last=true`);
    const simulated = await fetch(`${url}?simulate=unhealthy&last=false`);

    assert.equal(calls, 2);
    assert.equal(simulated.status, 503);
    assert.equal(simulated.headers.get('content-type'), 'application/json; charset=utf-8');
  });
});
