import assert from 'node:assert';
import { describe, it } from 'node:test';
import { Elysia } from 'elysia';
import { HealthStatus } from '../../src';
import { createElysiaHealthCheckHandler } from '../../src/integrations/elysia';

describe('Elysia Integration', () => {
  it('handles Elysia requests and passes the context to checkers', async () => {
    const handler = createElysiaHealthCheckHandler({
      debug: true,
      headers: { 'x-health': 'medicus' },
      checkers: {
        request(context) {
          return {
            status: HealthStatus.HEALTHY,
            debug: { path: context.path }
          };
        }
      }
    });
    const app = new Elysia().get('/ready', handler);

    const response = await app.handle(new Request('http://localhost/ready'));
    const body: any = await response.json();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-cache, no-store, must-revalidate');
    assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');
    assert.equal(response.headers.get('x-health'), 'medicus');
    assert.equal(body.services.request.debug.path, '/ready');
  });

  it('supports cached and simulated results', async () => {
    let calls = 0;
    const handler = createElysiaHealthCheckHandler({
      checkers: {
        service() {
          calls++;
          return HealthStatus.HEALTHY;
        }
      }
    });
    const app = new Elysia().get('/health', handler);

    await app.handle(new Request('http://localhost/health'));
    await app.handle(new Request('http://localhost/health?last=true'));
    const simulated = await app.handle(
      new Request('http://localhost/health?simulate=unhealthy&last=false')
    );

    assert.equal(calls, 2);
    assert.equal(simulated.status, 503);
  });
});
