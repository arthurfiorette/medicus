import assert from 'node:assert';
import type { Server } from 'node:http';
import { after, describe, it } from 'node:test';
import express, { type ErrorRequestHandler } from 'express';
import { HealthStatus, Medicus } from '../../src';
import { createExpressHealthCheckHandler } from '../../src/integrations/express';

describe('Express Integration', () => {
  const servers: Server[] = [];

  after(async () => {
    await Promise.all(servers.map((server) => closeServer(server)));
  });

  it('handles health requests with Express request context', async () => {
    const app = express();
    const handler = createExpressHealthCheckHandler({
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
    app.get('/health', handler);

    const server = app.listen(0);
    servers.push(server);
    const response = await fetch(serverUrl(server, '/health'));
    const body: any = await response.json();

    assert.ok(handler.medicus instanceof Medicus);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-cache, no-store, must-revalidate');
    assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');
    assert.equal(response.headers.get('x-health'), 'medicus');
    assert.equal(body.services.request.debug.path, '/health');
  });

  it('supports cached and simulated results', async () => {
    let calls = 0;
    const app = express();
    const handler = createExpressHealthCheckHandler({
      checkers: {
        service() {
          calls++;
          return HealthStatus.HEALTHY;
        }
      }
    });
    app.get('/health', handler);

    const server = app.listen(0);
    servers.push(server);
    await fetch(serverUrl(server, '/health'));
    const cached = await fetch(serverUrl(server, '/health?last=true'));
    const simulated = await fetch(serverUrl(server, '/health?simulate=unhealthy'));

    assert.equal(cached.status, 200);
    assert.equal(calls, 2);
    assert.equal(simulated.status, 503);
    assert.equal(((await simulated.json()) as any).status, HealthStatus.UNHEALTHY);
  });

  it('forwards unexpected failures to Express error middleware', async () => {
    const app = express();
    const handler = createExpressHealthCheckHandler({
      unhealthyLogger() {
        throw new Error('logger failed');
      },
      checkers: { service: () => HealthStatus.UNHEALTHY }
    });
    app.get('/health', handler);
    const errorHandler: ErrorRequestHandler = (_error, _req, res, _next) => {
      res.status(500).json({ handled: true });
    };
    app.use(errorHandler);

    const server = app.listen(0);
    servers.push(server);
    const response = await fetch(serverUrl(server, '/health'));

    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { handled: true });
  });
});

function serverUrl(server: Server, path: string): string {
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  return `http://127.0.0.1:${address.port}${path}`;
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}
