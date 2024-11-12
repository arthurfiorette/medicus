import assert from 'node:assert';
import { describe, it } from 'node:test';
import fastify, { type FastifyInstance } from 'fastify';
import { HealthStatus, Medicus } from '../../src';
import { medicusPlugin } from '../../src/integrations/fastify';

describe('medicusPlugin()', () => {
  it('registers a health check route', async () => {
    await using app = fastify();
    await app.register(medicusPlugin, {});

    assert.ok(app.medicus instanceof Medicus);

    const response = await app.inject({
      method: 'GET',
      url: '/health'
    });

    assert.deepStrictEqual(response.json(), {
      status: HealthStatus.HEALTHY,
      services: {}
    });
  });

  it('uses cached version when ?last=true', async () => {
    await using app = fastify();

    let last = false;

    await app.register(medicusPlugin, {
      checkers: {
        async checker() {
          last = !last;
          return last ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY;
        }
      }
    });

    const response = await app.inject({
      method: 'GET',
      url: '/health?last=true'
    });

    assert.deepStrictEqual(response.json(), {
      status: HealthStatus.HEALTHY,
      services: {}
    });

    const response2 = await app.inject({
      method: 'GET',
      url: '/health?last=true'
    });

    assert.deepStrictEqual(response2.json(), {
      // cached
      status: HealthStatus.HEALTHY,
      services: {}
    });
  });

  it('uses new version when ?last=false', async () => {
    await using app = fastify();

    let last = false;

    await app.register(medicusPlugin, {
      checkers: {
        async checker() {
          last = !last;
          return last ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY;
        }
      }
    });

    const response = await app.inject({
      method: 'GET',
      url: '/health?last=false'
    });

    assert.deepStrictEqual(response.json(), {
      status: HealthStatus.HEALTHY,
      services: {}
    });

    const response2 = await app.inject({
      method: 'GET',
      url: '/health?last=false'
    });

    assert.deepStrictEqual(response2.json(), {
      // not cached
      status: HealthStatus.UNHEALTHY,
      services: {}
    });
  });

  it('auto registers under-pressure checker', async () => {
    await using app = fastify();
    await app.register(import('@fastify/under-pressure'));
    await app.register(medicusPlugin, {
      debug: true
    });

    const response = await app.inject({
      method: 'GET',
      url: '/health'
    });

    assert.deepStrictEqual(response.json(), {
      // non debug
      status: HealthStatus.HEALTHY,
      services: {
        pressure: {
          status: HealthStatus.HEALTHY,
          // idk why its 0 but not our concern
          debug: { eventLoopDelay: 0, rssBytes: 0, heapUsed: 0, eventLoopUtilized: 0 }
        }
      }
    });
  });

  it('works with per request debug', async () => {
    await using app = fastify();
    await app.register(medicusPlugin, {
      checkers: {
        request() {
          return {
            status: HealthStatus.HEALTHY,
            debug: {
              request: 'debug'
            }
          };
        }
      },
      debug(req) {
        return req.headers['x-debug'] === '1233';
      }
    });

    const response1 = await app.inject({
      method: 'GET',
      url: '/health',
      headers: {
        'x-debug': '1233'
      }
    });

    assert.deepStrictEqual(response1.json(), {
      status: HealthStatus.HEALTHY,
      services: {
        request: {
          status: HealthStatus.HEALTHY,
          debug: {
            request: 'debug'
          }
        }
      }
    });

    const response2 = await app.inject({
      method: 'GET',
      url: '/health'
    });

    assert.deepStrictEqual(response2.json(), {
      status: HealthStatus.HEALTHY,
      services: {}
    });

    const response3 = await app.inject({
      method: 'GET',
      url: '/health',
      headers: {
        'x-debug': 'not 1233'
      }
    });

    assert.deepStrictEqual(response3.json(), {
      status: HealthStatus.HEALTHY,
      services: {}
    });
  });

  it('adds fastify as context', async () => {
    await using app = fastify();
    await app.register(medicusPlugin, {
      checkers: {
        checker(context: FastifyInstance) {
          assert.strictEqual(context, app);
          return HealthStatus.HEALTHY;
        }
      },
      debug: true
    });

    const response = await app.inject({
      method: 'GET',
      url: '/health'
    });

    assert.deepStrictEqual(response.json(), {
      status: HealthStatus.HEALTHY,
      services: {
        checker: {
          status: HealthStatus.HEALTHY
        }
      }
    });
  });
});
