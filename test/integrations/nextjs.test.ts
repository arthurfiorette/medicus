import assert from 'node:assert';
import { describe, it } from 'node:test';
import { HealthStatus, Medicus } from '../../src';
import { createNextApiHealthCheckHandler } from '../../src/integrations/nextjs';

// Mock Next.js types for testing
interface MockNextApiRequest {
  query: Record<string, string | string[] | undefined>;
}

interface MockNextApiResponse {
  statusCode?: number;
  headers: Record<string, string>;
  body?: unknown;
  status(code: number): this;
  setHeader(name: string, value: string): this;
  json(body: unknown): this;
}

function createMockResponse(): MockNextApiResponse {
  const response: MockNextApiResponse = {
    headers: {},
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name.toLowerCase()] = value;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    }
  };
  return response;
}

describe('Next.js Integration', () => {
  describe('createNextApiHealthCheckHandler', () => {
    it('creates a working health check handler', async () => {
      using medicus = new Medicus({
        checkers: {
          test: () => HealthStatus.HEALTHY
        }
      });

      const handler = createNextApiHealthCheckHandler(medicus);
      const req: MockNextApiRequest = { query: {} };
      const res = createMockResponse();

      //@ts-expect-error - mock types
      await handler(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.equal(res.headers['cache-control'], 'no-cache, no-store, must-revalidate');

      //@ts-expect-error - body is unknown
      assert.equal(res.body.status, 'healthy');
      //@ts-expect-error - body is unknown
      assert.equal(typeof res.body.services, 'object');
    });

    it('includes debug information when enabled via options', async () => {
      using medicus = new Medicus({
        checkers: {
          test: () => ({ status: HealthStatus.HEALTHY, debug: { key: 'value' } })
        }
      });

      const handler = createNextApiHealthCheckHandler(medicus, { debug: true });
      const req: MockNextApiRequest = { query: {} };
      const res = createMockResponse();

      //@ts-expect-error - mock types
      await handler(req, res);

      assert.equal(res.statusCode, 200);
      //@ts-expect-error - body is unknown
      assert.equal(res.body.status, 'healthy');
      //@ts-expect-error - body is unknown
      assert.ok(res.body.services.test);
      //@ts-expect-error - body is unknown
      assert.equal(res.body.services.test.debug.key, 'value');
    });

    it('supports debug query parameter', async () => {
      using medicus = new Medicus({
        checkers: {
          test: () => ({ status: HealthStatus.HEALTHY, debug: { key: 'value' } })
        }
      });

      const handler = createNextApiHealthCheckHandler(medicus);
      const req: MockNextApiRequest = { query: { debug: 'true' } };
      const res = createMockResponse();

      //@ts-expect-error - mock types
      await handler(req, res);

      assert.equal(res.statusCode, 200);
      //@ts-expect-error - body is unknown
      assert.equal(res.body.status, 'healthy');
      //@ts-expect-error - body is unknown
      assert.ok(res.body.services.test);
      //@ts-expect-error - body is unknown
      assert.equal(res.body.services.test.debug.key, 'value');
    });

    it('supports last query parameter', async () => {
      using medicus = new Medicus({
        checkers: {
          test: () => HealthStatus.HEALTHY
        }
      });

      const handler = createNextApiHealthCheckHandler(medicus);

      // First request to populate lastCheck
      const req1: MockNextApiRequest = { query: {} };
      const res1 = createMockResponse();
      //@ts-expect-error - mock types
      await handler(req1, res1);

      // Second request with last=true
      const req2: MockNextApiRequest = { query: { last: 'true' } };
      const res2 = createMockResponse();
      //@ts-expect-error - mock types
      await handler(req2, res2);

      assert.equal(res2.statusCode, 200);
      //@ts-expect-error - body is unknown
      assert.equal(res2.body.status, 'healthy');
    });

    it('supports simulate query parameter', async () => {
      using medicus = new Medicus({
        checkers: {
          test: () => HealthStatus.HEALTHY
        }
      });

      const handler = createNextApiHealthCheckHandler(medicus);
      const req: MockNextApiRequest = { query: { simulate: 'unhealthy' } };
      const res = createMockResponse();

      //@ts-expect-error - mock types
      await handler(req, res);

      assert.equal(res.statusCode, 503);
      //@ts-expect-error - body is unknown
      assert.equal(res.body.status, 'unhealthy');
    });

    it('ignores invalid simulate values', async () => {
      using medicus = new Medicus({
        checkers: {
          test: () => HealthStatus.HEALTHY
        }
      });

      const handler = createNextApiHealthCheckHandler(medicus);
      const req: MockNextApiRequest = { query: { simulate: 'invalid' } };
      const res = createMockResponse();

      //@ts-expect-error - mock types
      await handler(req, res);

      assert.equal(res.statusCode, 200);
      //@ts-expect-error - body is unknown
      assert.equal(res.body.status, 'healthy');
    });

    it('returns appropriate status codes', async () => {
      using healthyMedicus = new Medicus({
        checkers: { test: () => HealthStatus.HEALTHY }
      });

      using degradedMedicus = new Medicus({
        checkers: { test: () => HealthStatus.DEGRADED }
      });

      using unhealthyMedicus = new Medicus({
        checkers: { test: () => HealthStatus.UNHEALTHY }
      });

      // Test healthy (200)
      const healthyHandler = createNextApiHealthCheckHandler(healthyMedicus);
      const healthyReq: MockNextApiRequest = { query: {} };
      const healthyRes = createMockResponse();
      //@ts-expect-error - mock types
      await healthyHandler(healthyReq, healthyRes);
      assert.equal(healthyRes.statusCode, 200);

      // Test degraded (200)
      const degradedHandler = createNextApiHealthCheckHandler(degradedMedicus);
      const degradedReq: MockNextApiRequest = { query: {} };
      const degradedRes = createMockResponse();
      //@ts-expect-error - mock types
      await degradedHandler(degradedReq, degradedRes);
      assert.equal(degradedRes.statusCode, 200);

      // Test unhealthy (503)
      const unhealthyHandler = createNextApiHealthCheckHandler(unhealthyMedicus);
      const unhealthyReq: MockNextApiRequest = { query: {} };
      const unhealthyRes = createMockResponse();
      //@ts-expect-error - mock types
      await unhealthyHandler(unhealthyReq, unhealthyRes);
      assert.equal(unhealthyRes.statusCode, 503);
    });

    it('handles health check errors gracefully', async () => {
      using medicus = new Medicus({
        errorLogger() {},
        checkers: {
          failing: () => {
            throw new Error('Test error');
          }
        }
      });

      const handler = createNextApiHealthCheckHandler(medicus);
      const req: MockNextApiRequest = { query: {} };
      const res = createMockResponse();

      //@ts-expect-error - mock types
      await handler(req, res);

      assert.equal(res.statusCode, 503);
      //@ts-expect-error - body is unknown
      assert.equal(res.body.status, 'unhealthy');
      //@ts-expect-error - body is unknown
      assert.equal(typeof res.body.services, 'object');
    });

    it('handles array query parameters', async () => {
      using medicus = new Medicus({
        checkers: {
          test: () => HealthStatus.HEALTHY
        }
      });

      const handler = createNextApiHealthCheckHandler(medicus);
      const req: MockNextApiRequest = { query: { debug: ['true', 'false'] } };
      const res = createMockResponse();

      //@ts-expect-error - mock types
      await handler(req, res);

      // Should handle gracefully without throwing
      assert.equal(res.statusCode, 200);
      //@ts-expect-error - body is unknown
      assert.equal(res.body.status, 'healthy');
    });

    it('works with multiple checkers', async () => {
      using medicus = new Medicus({
        checkers: {
          database: () => HealthStatus.HEALTHY,
          redis: () => HealthStatus.HEALTHY,
          api: () => HealthStatus.DEGRADED
        }
      });

      const handler = createNextApiHealthCheckHandler(medicus);
      const req: MockNextApiRequest = { query: { debug: 'true' } };
      const res = createMockResponse();

      //@ts-expect-error - mock types
      await handler(req, res);

      assert.equal(res.statusCode, 200);
      //@ts-expect-error - body is unknown
      assert.equal(res.body.status, 'degraded'); // Lowest status wins
      //@ts-expect-error - body is unknown
      assert.ok(res.body.services.database);
      //@ts-expect-error - body is unknown
      assert.ok(res.body.services.redis);
      //@ts-expect-error - body is unknown
      assert.ok(res.body.services.api);
    });

    it('respects custom context', async () => {
      interface MyContext {
        config: { apiUrl: string };
      }

      const context: MyContext = {
        config: { apiUrl: 'https://api.example.com' }
      };

      using medicus = new Medicus<MyContext>({
        context,
        checkers: {
          api: (ctx) => {
            // Verify we can access context
            assert.ok(ctx?.config.apiUrl);
            return HealthStatus.HEALTHY;
          }
        }
      });

      const handler = createNextApiHealthCheckHandler(medicus);
      const req: MockNextApiRequest = { query: {} };
      const res = createMockResponse();

      //@ts-expect-error - mock types
      await handler(req, res);

      assert.equal(res.statusCode, 200);
      //@ts-expect-error - body is unknown
      assert.equal(res.body.status, 'healthy');
    });

    it('sets correct response headers', async () => {
      using medicus = new Medicus({
        checkers: {
          test: () => HealthStatus.HEALTHY
        }
      });

      const handler = createNextApiHealthCheckHandler(medicus);
      const req: MockNextApiRequest = { query: {} };
      const res = createMockResponse();

      //@ts-expect-error - mock types
      await handler(req, res);

      assert.equal(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.equal(res.headers['cache-control'], 'no-cache, no-store, must-revalidate');
    });
  });
});
