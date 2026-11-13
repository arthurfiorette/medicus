import assert from 'node:assert';
import { describe, it } from 'node:test';
import { Elysia } from 'elysia';
import { HealthStatus, Medicus } from '../../src';
import { createElysiaHealthCheckHandler } from '../../src/integrations/elysia';

describe('Elysia Integration', () => {
  it('mounts at the user-defined route and passes request context to checkers', async () => {
    const handler = createElysiaHealthCheckHandler({
      debug: true,
      headers: { 'x-health': 'medicus' },
      checkers: {
        request(context) {
          return {
            status: HealthStatus.HEALTHY,
            debug: { path: new URL(context.request.url).pathname }
          };
        }
      }
    });
    const app = new Elysia().get('/ready', handler);

    const response = await app.handle(new Request('http://localhost/ready'));
    const missing = await app.handle(new Request('http://localhost/health'));
    const body: any = await response.json();

    assert.ok(handler.medicus instanceof Medicus);
    assert.equal(response.status, 200);
    assert.equal(missing.status, 404);
    assert.equal(response.headers.get('cache-control'), 'no-cache, no-store, must-revalidate');
    assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');
    assert.equal(response.headers.get('x-health'), 'medicus');
    assert.equal(body.services.request.debug.path, '/ready');
  });

  it('supports debug, cached, and simulated results', async () => {
    let calls = 0;
    const handler = createElysiaHealthCheckHandler({
      checkers: {
        service() {
          calls++;
          return {
            status: HealthStatus.HEALTHY,
            debug: { visible: true }
          };
        }
      }
    });
    const app = new Elysia().get('/health', handler);

    const first = await app.handle(new Request('http://localhost/health?debug=true'));
    const firstBody: any = await first.json();
    const cached = await app.handle(new Request('http://localhost/health?last=true'));
    const simulated = await app.handle(new Request('http://localhost/health?simulate=unhealthy'));

    assert.equal(firstBody.services.service.debug.visible, true);
    assert.equal(cached.status, 200);
    assert.equal(calls, 2);
    assert.equal(simulated.status, 503);
  });

  it('allows late checker registration through the handler', async () => {
    const handler = createElysiaHealthCheckHandler();
    handler.medicus.addChecker({ late: () => HealthStatus.DEGRADED });
    const app = new Elysia().get('/health', handler);

    const response = await app.handle(new Request('http://localhost/health'));

    assert.equal(response.status, 200);
    assert.equal(((await response.json()) as any).status, HealthStatus.DEGRADED);
  });
});
