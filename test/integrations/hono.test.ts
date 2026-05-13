import assert from 'node:assert';
import { describe, it } from 'node:test';
import { Hono } from 'hono';
import { HealthStatus, Medicus } from '../../src';
import { createHonoHealthCheckHandler } from '../../src/integrations/hono';

describe('Hono Integration', () => {
  it('creates a working health check route', async () => {
    using medicus = new Medicus({
      checkers: {
        test: () => HealthStatus.HEALTHY
      }
    });

    const app = new Hono();
    app.get('/health', createHonoHealthCheckHandler(medicus));

    const response = await app.request('/health');

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-cache, no-store, must-revalidate');

    const body = await response.json();
    assert.equal(body.status, HealthStatus.HEALTHY);
  });

  it('supports debug query parameter', async () => {
    using medicus = new Medicus({
      checkers: {
        test: () => ({ status: HealthStatus.HEALTHY, debug: { key: 'value' } })
      }
    });

    const app = new Hono();
    app.get('/health', createHonoHealthCheckHandler(medicus));

    const response = await app.request('/health?debug=true');
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, HealthStatus.HEALTHY);
    assert.equal(body.services.test.debug.key, 'value');
  });

  it('supports last query parameter', async () => {
    using medicus = new Medicus({
      checkers: {
        test: () => HealthStatus.HEALTHY
      }
    });

    const app = new Hono();
    app.get('/health', createHonoHealthCheckHandler(medicus));

    await app.request('/health');
    const response = await app.request('/health?last=true');
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, HealthStatus.HEALTHY);
  });

  it('supports simulate query parameter', async () => {
    using medicus = new Medicus({
      checkers: {
        test: () => HealthStatus.HEALTHY
      }
    });

    const app = new Hono();
    app.get('/health', createHonoHealthCheckHandler(medicus));

    const response = await app.request('/health?simulate=unhealthy');
    const body = await response.json();

    assert.equal(response.status, 503);
    assert.equal(body.status, HealthStatus.UNHEALTHY);
  });

  it('allows custom headers', async () => {
    using medicus = new Medicus({
      checkers: {
        test: () => HealthStatus.HEALTHY
      }
    });

    const app = new Hono();
    app.get(
      '/health',
      createHonoHealthCheckHandler(medicus, {
        headers: {
          'x-custom': 'test'
        }
      })
    );

    const response = await app.request('/health');

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-custom'), 'test');
  });
});
