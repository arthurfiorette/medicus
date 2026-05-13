import assert from 'node:assert';
import { describe, it } from 'node:test';
import { HealthStatus } from '../../src';
import {
  createNextHealthCheckHandler,
  createNextPagesHealthCheckHandler
} from '../../src/integrations/nextjs';

// Mock Next.js App Router types
interface MockNextRequest {
  nextUrl: {
    searchParams: URLSearchParams;
  };
  headers: Map<string, string>;
}

function createMockNextRequest(queryParams: Record<string, string> = {}): MockNextRequest {
  const searchParams = new URLSearchParams(queryParams);
  const headers = new Map<string, string>();
  return {
    nextUrl: { searchParams },
    headers
  };
}

// Mock Next.js Pages Router types
interface MockPagesRequest {
  query: Record<string, string | string[] | undefined>;
  headers: Record<string, string>;
}

interface MockPagesResponse {
  statusCode?: number;
  headers: Record<string, string>;
  body?: unknown;
  status(code: number): this;
  setHeader(name: string, value: string): this;
  json(body: unknown): this;
}

function createMockPagesResponse(): MockPagesResponse {
  const response: MockPagesResponse = {
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
  describe('createNextHealthCheckHandler (App Router)', () => {
    it('creates a working health check handler', async () => {
      const handler = createNextHealthCheckHandler({
        checkers: {
          test: () => HealthStatus.HEALTHY
        }
      });

      const req = createMockNextRequest();

      //@ts-expect-error - mock types
      const response = await handler(req);

      assert.ok(response);
      //@ts-expect-error - NextResponse type
      assert.equal(response.status, 200);
      //@ts-expect-error - NextResponse type
      const body = await response.json();
      assert.equal(body.status, 'healthy');
    });

    it('supports debug query parameter', async () => {
      const handler = createNextHealthCheckHandler({
        checkers: {
          test: () => ({ status: HealthStatus.HEALTHY, debug: { key: 'value' } })
        }
      });

      const req = createMockNextRequest({ debug: 'true' });

      //@ts-expect-error - mock types
      const response = await handler(req);

      //@ts-expect-error - NextResponse type
      const body = await response.json();
      assert.equal(body.status, 'healthy');
      assert.ok(body.services.test);
      assert.equal(body.services.test.debug.key, 'value');
    });

    it('supports debug detector function', async () => {
      const handler = createNextHealthCheckHandler({
        checkers: {
          test: () => ({ status: HealthStatus.HEALTHY, debug: { key: 'value' } })
        },
        debug: (req) => req.headers.get('authorization') === 'Bearer secret'
      });

      // Without auth
      const req1 = createMockNextRequest();
      //@ts-expect-error - mock types
      const response1 = await handler(req1);
      //@ts-expect-error - NextResponse type
      const body1 = await response1.json();
      assert.equal(Object.keys(body1.services).length, 0);

      // With auth
      const req2 = createMockNextRequest();
      req2.headers.set('authorization', 'Bearer secret');
      //@ts-expect-error - mock types
      const response2 = await handler(req2);
      //@ts-expect-error - NextResponse type
      const body2 = await response2.json();
      assert.equal(body2.services.test.debug.key, 'value');
    });

    it('supports custom headers', async () => {
      const handler = createNextHealthCheckHandler({
        checkers: {
          test: () => HealthStatus.HEALTHY
        },
        headers: {
          'x-custom': 'test'
        }
      });

      const req = createMockNextRequest();

      //@ts-expect-error - mock types
      const response = await handler(req);

      //@ts-expect-error - NextResponse type
      assert.equal(response.headers.get('x-custom'), 'test');
    });

    it('returns appropriate status codes', async () => {
      const unhealthyHandler = createNextHealthCheckHandler({
        checkers: {
          test: () => HealthStatus.UNHEALTHY
        }
      });

      const req = createMockNextRequest();

      //@ts-expect-error - mock types
      const response = await unhealthyHandler(req);

      //@ts-expect-error - NextResponse type
      assert.equal(response.status, 503);
      //@ts-expect-error - NextResponse type
      const body = await response.json();
      assert.equal(body.status, 'unhealthy');
    });
  });

  describe('createNextPagesHealthCheckHandler (Pages Router)', () => {
    it('creates a working health check handler', async () => {
      const handler = createNextPagesHealthCheckHandler({
        checkers: {
          test: () => HealthStatus.HEALTHY
        }
      });

      const req: MockPagesRequest = { query: {}, headers: {} };
      const res = createMockPagesResponse();

      //@ts-expect-error - mock types
      await handler(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.equal(res.headers['cache-control'], 'no-cache, no-store, must-revalidate');

      //@ts-expect-error - body is unknown
      assert.equal(res.body.status, 'healthy');
    });

    it('supports debug query parameter', async () => {
      const handler = createNextPagesHealthCheckHandler({
        checkers: {
          test: () => ({ status: HealthStatus.HEALTHY, debug: { key: 'value' } })
        }
      });

      const req: MockPagesRequest = { query: { debug: 'true' }, headers: {} };
      const res = createMockPagesResponse();

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

    it('supports debug detector function', async () => {
      const handler = createNextPagesHealthCheckHandler({
        checkers: {
          test: () => ({ status: HealthStatus.HEALTHY, debug: { key: 'value' } })
        },
        debug: (req) => req.headers?.authorization === 'Bearer secret'
      });

      // Without auth
      const req1: MockPagesRequest = { query: {}, headers: {} };
      const res1 = createMockPagesResponse();

      //@ts-expect-error - mock types
      await handler(req1, res1);

      //@ts-expect-error - body is unknown
      assert.equal(Object.keys(res1.body.services).length, 0);

      // With auth
      const req2: MockPagesRequest = { query: {}, headers: { authorization: 'Bearer secret' } };
      const res2 = createMockPagesResponse();

      //@ts-expect-error - mock types
      await handler(req2, res2);

      //@ts-expect-error - body is unknown
      assert.equal(res2.body.services.test.debug.key, 'value');
    });

    it('supports custom headers', async () => {
      const handler = createNextPagesHealthCheckHandler({
        checkers: {
          test: () => HealthStatus.HEALTHY
        },
        headers: {
          'x-custom': 'test'
        }
      });

      const req: MockPagesRequest = { query: {}, headers: {} };
      const res = createMockPagesResponse();

      //@ts-expect-error - mock types
      await handler(req, res);

      assert.equal(res.headers['x-custom'], 'test');
    });

    it('returns appropriate status codes', async () => {
      const unhealthyHandler = createNextPagesHealthCheckHandler({
        checkers: {
          test: () => HealthStatus.UNHEALTHY
        }
      });

      const req: MockPagesRequest = { query: {}, headers: {} };
      const res = createMockPagesResponse();

      //@ts-expect-error - mock types
      await unhealthyHandler(req, res);

      assert.equal(res.statusCode, 503);
      //@ts-expect-error - body is unknown
      assert.equal(res.body.status, 'unhealthy');
    });
  });
});
