import assert from 'node:assert';
import { describe, it } from 'node:test';
import { Hono } from 'hono';
import { HealthStatus, Medicus } from '../../src';
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
    assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');

    const body: any = await response.json();
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
    const body: any = await response.json();

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
    const body: any = await response.json();

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
    const body: any = await response.json();

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
    const body: any = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.services.pathChecker.debug.path, '/health');
  });

  it('sets medicus instance into request context', async () => {
    const app = new Hono();
    let hasMedicusOnContext = false;

    app.get(
      '/health',
      createHonoHealthCheckHandler({
        checkers: {
          contextChecker(context) {
            hasMedicusOnContext = context.get('medicus') instanceof Medicus;
            return HealthStatus.HEALTHY;
          }
        }
      })
    );

    const response = await app.request('/health');

    assert.equal(response.status, 200);
    assert.equal(hasMedicusOnContext, true);
  });

  it('preserves custom Hono app bindings and variables in checkers', async () => {
    type App = {
      Bindings: {
        RELEASE: string;
      };
      Variables: {
        db: {
          healthCheck(): Promise<void>;
        };
        requestId: string;
      };
    };

    const app = new Hono<App>();
    let checkedDb = false;

    app.use('*', async (context, next) => {
      context.set('db', {
        async healthCheck() {
          checkedDb = true;
        }
      });
      context.set('requestId', 'req-1');

      await next();
    });

    app.get(
      '/health',
      createHonoHealthCheckHandler<App>({
        debug: true,
        checkers: {
          async typedContext(context) {
            await context.get('db').healthCheck();

            return {
              status: HealthStatus.HEALTHY,
              debug: {
                hasMedicus: context.get('medicus') instanceof Medicus,
                release: context.env.RELEASE,
                requestId: context.get('requestId')
              }
            };
          }
        }
      })
    );

    const response = await app.request('/health', undefined, { RELEASE: 'test' });
    const body: any = await response.json();

    assert.equal(response.status, 200);
    assert.equal(checkedDb, true);
    assert.equal(body.services.typedContext.debug.hasMedicus, true);
    assert.equal(body.services.typedContext.debug.release, 'test');
    assert.equal(body.services.typedContext.debug.requestId, 'req-1');
  });
});
