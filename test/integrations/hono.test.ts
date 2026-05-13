import assert from 'node:assert';
import { describe, it } from 'node:test';
import { Hono } from 'hono';
import { HealthStatus } from '../../src';
import { createHonoHealthCheckHandler } from '../../src/integrations/hono';

describe('Hono Integration', () => {
  it('creates a working health check route', async () => {
    const app = new Hono();
    app.get(
      '/health',
      createHonoHealthCheckHandler({
        checkers: {
          test: () => HealthStatus.HEALTHY
        }
      })
    );

    const response = await app.request('/health');

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-cache, no-store, must-revalidate');

    const body = await response.json();
    assert.equal(body.status, HealthStatus.HEALTHY);
  });

  it('supports debug query parameter', async () => {
    const app = new Hono();
    app.get(
      '/health',
      createHonoHealthCheckHandler({
        checkers: {
          test: () => ({ status: HealthStatus.HEALTHY, debug: { key: 'value' } })
        }
      })
    );

    const response = await app.request('/health?debug=true');
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, HealthStatus.HEALTHY);
    assert.equal(body.services.test.debug.key, 'value');
  });

  it('supports last query parameter', async () => {
    const app = new Hono();
    app.get(
      '/health',
      createHonoHealthCheckHandler({
        checkers: {
          test: () => HealthStatus.HEALTHY
        }
      })
    );

    await app.request('/health');
    const response = await app.request('/health?last=true');
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, HealthStatus.HEALTHY);
  });

  it('supports simulate query parameter', async () => {
    const app = new Hono();
    app.get(
      '/health',
      createHonoHealthCheckHandler({
        checkers: {
          test: () => HealthStatus.HEALTHY
        }
      })
    );

    const response = await app.request('/health?simulate=unhealthy');
    const body = await response.json();

    assert.equal(response.status, 503);
    assert.equal(body.status, HealthStatus.UNHEALTHY);
  });

  it('allows custom headers', async () => {
    const app = new Hono();
    app.get(
      '/health',
      createHonoHealthCheckHandler({
        checkers: {
          test: () => HealthStatus.HEALTHY
        },
        headers: {
          'x-custom': 'test'
        }
      })
    );

    const response = await app.request('/health');

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-custom'), 'test');
  });

  it('uses hono request context by default', async () => {
    const app = new Hono();
    app.get(
      '/health',
      createHonoHealthCheckHandler({
        debug: true,
        checkers: {
          pathChecker(context) {
            return {
              status: HealthStatus.HEALTHY,
              debug: {
                path: context.req.path
              }
            };
          }
        }
      })
    );

    const response = await app.request('/health?debug=true');
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.services.pathChecker.debug.path, '/health');
  });

  it('respects explicit context override', async () => {
    const app = new Hono();
    app.get(
      '/health',
      createHonoHealthCheckHandler({
        context: {
          origin: 'explicit-context'
        },
        debug: true,
        checkers: {
          customContextChecker(context) {
            return {
              status: HealthStatus.HEALTHY,
              debug: {
                origin: context.origin
              }
            };
          }
        }
      })
    );

    const response = await app.request('/health?debug=true');
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.services.customContextChecker.debug.origin, 'explicit-context');
  });
});
