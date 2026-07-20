import assert from 'node:assert';
import { describe, it } from 'node:test';
import { HealthStatus, Medicus } from '../../src';
import {
  createTanStackStartHealthCheckHandler,
  type TanStackStartHealthCheckInput
} from '../../src/integrations/tanstack-start';

describe('TanStack Start Integration', () => {
  it('creates a working health check handler', async () => {
    const handler = createTanStackStartHealthCheckHandler({
      checkers: {
        test: () => HealthStatus.HEALTHY
      }
    });

    const result = await handler();

    assert.equal(result.status, HealthStatus.HEALTHY);
    assert.equal(result.services.test, undefined);
  });

  it('supports the debug input flag', async () => {
    const handler = createTanStackStartHealthCheckHandler({
      checkers: {
        test: () => ({ status: HealthStatus.HEALTHY, debug: { key: 'value' } })
      }
    });

    const result = await handler({ data: { debug: true } });

    assert.equal(result.status, HealthStatus.HEALTHY);
    assert.equal(result.services.test!.debug!.key, 'value');
  });

  it('supports debug by default via options', async () => {
    const handler = createTanStackStartHealthCheckHandler({
      debug: true,
      checkers: {
        test: () => ({ status: HealthStatus.HEALTHY, debug: { key: 'value' } })
      }
    });

    const result = await handler();

    assert.equal(result.services.test!.debug!.key, 'value');
  });

  it('supports the last input flag', async () => {
    let calls = 0;

    const handler = createTanStackStartHealthCheckHandler({
      checkers: {
        test() {
          calls++;
          return HealthStatus.HEALTHY;
        }
      }
    });

    await handler();
    const result = await handler({ data: { last: true } });

    assert.equal(result.status, HealthStatus.HEALTHY);
    assert.equal(calls, 1);
  });

  it('performs a fresh check when last is requested without a cached result', async () => {
    const handler = createTanStackStartHealthCheckHandler({
      checkers: {
        test: () => HealthStatus.HEALTHY
      }
    });

    const result = await handler({ data: { last: true } });

    assert.equal(result.status, HealthStatus.HEALTHY);
  });

  it('supports the simulate input flag', async () => {
    const handler = createTanStackStartHealthCheckHandler({
      checkers: {
        test: () => HealthStatus.HEALTHY
      }
    });

    const result = await handler({ data: { simulate: HealthStatus.UNHEALTHY } });

    assert.equal(result.status, HealthStatus.UNHEALTHY);
  });

  it('ignores invalid simulate values', async () => {
    const handler = createTanStackStartHealthCheckHandler({
      checkers: {
        test: () => HealthStatus.HEALTHY
      }
    });

    const result = await handler({ data: { simulate: 'not-a-status' } });

    assert.equal(result.status, HealthStatus.HEALTHY);
  });

  it('reports unhealthy checkers', async () => {
    const handler = createTanStackStartHealthCheckHandler({
      checkers: {
        failing() {
          throw new Error('boom');
        }
      }
    });

    const result = await handler();

    assert.equal(result.status, HealthStatus.UNHEALTHY);
  });

  it('passes the server function context to checkers', async () => {
    type Ctx = {
      data?: { debug?: boolean };
      context: { requestId: string };
    };

    const handler = createTanStackStartHealthCheckHandler<Ctx>({
      debug: true,
      checkers: {
        // medicus provides the timeout signal as the second checker argument
        ctxChecker(ctx, signal) {
          return {
            status: HealthStatus.HEALTHY,
            debug: {
              requestId: ctx.context.requestId,
              aborted: signal.aborted
            }
          };
        }
      }
    });

    const result = await handler({
      context: { requestId: 'req-1' }
    });

    assert.equal(result.status, HealthStatus.HEALTHY);
    assert.equal(result.services.ctxChecker!.debug!.requestId, 'req-1');
    assert.equal(result.services.ctxChecker!.debug!.aborted, false);
  });

  // compile-time + construction check against the real TanStack Start API,
  // invoking the server fn requires a full Start runtime and is out of scope.
  // dynamic import because @tanstack/react-start is ESM-only
  it('is assignable to createServerFn().handler()', async () => {
    const { createServerFn } = await import('@tanstack/react-start');

    const withoutValidator = createServerFn({ method: 'GET' }).handler(
      createTanStackStartHealthCheckHandler({
        checkers: {
          test: () => HealthStatus.HEALTHY
        }
      })
    );

    const withValidator = createServerFn({ method: 'GET' })
      .validator((data?: TanStackStartHealthCheckInput) => data)
      .handler(createTanStackStartHealthCheckHandler());

    assert.equal(typeof withoutValidator, 'function');
    assert.equal(typeof withValidator, 'function');
  });

  it('exposes the underlying medicus instance', async () => {
    const handler = createTanStackStartHealthCheckHandler();

    assert.ok(handler.medicus instanceof Medicus);

    // registering checkers later must affect subsequent calls
    handler.medicus.addChecker({
      late: () => HealthStatus.DEGRADED
    });

    const result = await handler();

    assert.equal(result.status, HealthStatus.DEGRADED);
  });
});
