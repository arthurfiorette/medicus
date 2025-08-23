import assert from 'node:assert';
import http, {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse
} from 'node:http';
import { after, describe, it } from 'node:test';
import { HealthStatus, Medicus } from '../../src';
import { createHttpHealthCheckHandler } from '../../src/integrations/http';

describe('HTTP Integration', () => {
  const servers: Server[] = [];

  after(() => {
    // Clean up all test servers
    for (const server of servers) {
      server.close();
    }
  });

  describe('createHttpHealthCheckHandler', () => {
    it('creates a working health check handler', async () => {
      using medicus = new Medicus({
        checkers: {
          test: () => HealthStatus.HEALTHY
        }
      });

      const handleHealthCheck = createHttpHealthCheckHandler(medicus);
      const server = createServer((req, res) => {
        const url = new URL(req.url || '/', `http://${req.headers.host}`);
        handleHealthCheck(url.searchParams, res);
      });
      servers.push(server);

      const response = await makeRequest(server, '/');

      assert.equal(response.statusCode, 200);
      assert.equal(response.headers['content-type'], 'application/json; charset=utf-8');
      assert.equal(response.headers['cache-control'], 'no-cache, no-store, must-revalidate');

      const body = JSON.parse(response.body);
      assert.equal(body.status, 'healthy');
      assert.equal(typeof body.services, 'object');
    });

    it('includes debug information when enabled via options', async () => {
      using medicus = new Medicus({
        checkers: {
          test: () => ({ status: HealthStatus.HEALTHY, debug: { key: 'value' } })
        }
      });

      const handleHealthCheck = createHttpHealthCheckHandler(medicus, { debug: true });
      const server = createServer((req, res) => {
        const url = new URL(req.url || '/', `http://${req.headers.host}`);
        handleHealthCheck(url.searchParams, res);
      });
      servers.push(server);

      const response = await makeRequest(server, '/');

      const body = JSON.parse(response.body);
      assert.equal(body.status, 'healthy');
      assert.ok(body.services.test);
      assert.equal(body.services.test.debug.key, 'value');
    });

    it('supports debug query parameter', async () => {
      using medicus = new Medicus({
        checkers: {
          test: () => ({ status: HealthStatus.HEALTHY, debug: { key: 'value' } })
        }
      });

      const handleHealthCheck = createHttpHealthCheckHandler(medicus);
      const server = createServer((req, res) => {
        const url = new URL(req.url || '/', `http://${req.headers.host}`);
        handleHealthCheck(url.searchParams, res);
      });
      servers.push(server);

      const response = await makeRequest(server, '/?debug=true');

      const body = JSON.parse(response.body);
      assert.equal(body.status, 'healthy');
      assert.ok(body.services.test);
      assert.equal(body.services.test.debug.key, 'value');
    });

    it('supports last query parameter', async () => {
      using medicus = new Medicus({
        checkers: {
          test: () => HealthStatus.HEALTHY
        }
      });

      const handleHealthCheck = createHttpHealthCheckHandler(medicus);
      const server = createServer((req, res) => {
        const url = new URL(req.url || '/', `http://${req.headers.host}`);
        handleHealthCheck(url.searchParams, res);
      });
      servers.push(server);

      // First request to populate lastCheck
      await makeRequest(server, '/');

      // Second request with last=true
      const response = await makeRequest(server, '/?last=true');

      const body = JSON.parse(response.body);
      assert.equal(body.status, 'healthy');
    });

    it('supports simulate query parameter', async () => {
      using medicus = new Medicus({
        checkers: {
          test: () => HealthStatus.HEALTHY
        }
      });

      const handleHealthCheck = createHttpHealthCheckHandler(medicus);
      const server = createServer((req, res) => {
        const url = new URL(req.url || '/', `http://${req.headers.host}`);
        handleHealthCheck(url.searchParams, res);
      });
      servers.push(server);

      const response = await makeRequest(server, '/?simulate=unhealthy');

      assert.equal(response.statusCode, 503);
      const body = JSON.parse(response.body);
      assert.equal(body.status, 'unhealthy');
    });

    it('ignores invalid simulate values', async () => {
      using medicus = new Medicus({
        checkers: {
          test: () => HealthStatus.HEALTHY
        }
      });

      const handleHealthCheck = createHttpHealthCheckHandler(medicus);
      const server = createServer((req, res) => {
        const url = new URL(req.url || '/', `http://${req.headers.host}`);
        handleHealthCheck(url.searchParams, res);
      });
      servers.push(server);

      const response = await makeRequest(server, '/?simulate=invalid');

      assert.equal(response.statusCode, 200);
      const body = JSON.parse(response.body);
      assert.equal(body.status, 'healthy');
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
      const healthyHandler = createHttpHealthCheckHandler(healthyMedicus);
      const healthyServer = createServer((req, res) => {
        const searchParams = new URLSearchParams(req.url?.split('?')[1] || '');
        healthyHandler(searchParams, res);
      });
      servers.push(healthyServer);

      const healthyResponse = await makeRequest(healthyServer, '/');
      assert.equal(healthyResponse.statusCode, 200);

      // Test degraded (200)
      const degradedHandler = createHttpHealthCheckHandler(degradedMedicus);
      const degradedServer = createServer((req, res) => {
        const searchParams = new URLSearchParams(req.url?.split('?')[1] || '');
        degradedHandler(searchParams, res);
      });
      servers.push(degradedServer);

      const degradedResponse = await makeRequest(degradedServer, '/');
      assert.equal(degradedResponse.statusCode, 200);

      // Test unhealthy (503)
      const unhealthyHandler = createHttpHealthCheckHandler(unhealthyMedicus);
      const unhealthyServer = createServer((req, res) => {
        const searchParams = new URLSearchParams(req.url?.split('?')[1] || '');
        unhealthyHandler(searchParams, res);
      });
      servers.push(unhealthyServer);

      const unhealthyResponse = await makeRequest(unhealthyServer, '/');
      assert.equal(unhealthyResponse.statusCode, 503);
    });

    it('allows custom headers', async () => {
      using medicus = new Medicus({
        checkers: {
          test: () => HealthStatus.HEALTHY
        }
      });

      const handleHealthCheck = createHttpHealthCheckHandler(medicus, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Custom': 'test'
        }
      });
      const server = createServer((req, res) => {
        const url = new URL(req.url || '/', `http://${req.headers.host}`);
        handleHealthCheck(url.searchParams, res);
      });
      servers.push(server);

      const response = await makeRequest(server, '/');
      assert.equal(response.headers['x-custom'], 'test');
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

      const handleHealthCheck = createHttpHealthCheckHandler(medicus);
      const server = createServer((req, res) => {
        const url = new URL(req.url || '/', `http://${req.headers.host}`);
        handleHealthCheck(url.searchParams, res);
      });
      servers.push(server);

      const response = await makeRequest(server, '/');

      assert.equal(response.statusCode, 503);
      const body = JSON.parse(response.body);
      assert.equal(body.status, 'unhealthy');
      assert.equal(typeof body.services, 'object');
    });

    it('can be used with routing logic', async () => {
      using medicus = new Medicus({
        checkers: {
          test: () => HealthStatus.HEALTHY
        }
      });

      const handleHealthCheck = createHttpHealthCheckHandler(medicus);

      const server = createServer((req: IncomingMessage, res: ServerResponse) => {
        if (req.url?.startsWith('/health')) {
          const url = new URL(req.url, `http://${req.headers.host}`);
          return handleHealthCheck(url.searchParams, res);
        }
        if (req.url === '/test') {
          res.end('test response');
          return;
        }
        res.statusCode = 404;
        res.end('Not Found');
      });
      servers.push(server);

      // Test health endpoint
      const healthResponse = await makeRequest(server, '/health');
      assert.equal(healthResponse.statusCode, 200);
      const healthBody = JSON.parse(healthResponse.body);
      assert.equal(healthBody.status, 'healthy');

      // Test health endpoint with query params
      const healthWithParamsResponse = await makeRequest(server, '/health?debug=true');
      assert.equal(healthWithParamsResponse.statusCode, 200);

      // Test other endpoint
      const testResponse = await makeRequest(server, '/test');
      assert.equal(testResponse.body, 'test response');

      // Test 404
      const notFoundResponse = await makeRequest(server, '/notfound');
      assert.equal(notFoundResponse.statusCode, 404);
    });
  });
});

interface TestResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

function makeRequest(server: Server, path: string): Promise<TestResponse> {
  return new Promise((resolve, reject) => {
    const port = getAvailablePort();

    const serverInstance = server.listen(port, () => {
      const options = {
        hostname: 'localhost',
        port: port,
        path: path,
        method: 'GET'
      };

      const req = http.request(options, (res: any) => {
        let body = '';

        res.on('data', (chunk: any) => {
          body += chunk;
        });

        res.on('end', () => {
          serverInstance.close(() => {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body
            });
          });
        });
      });

      req.on('error', (err: any) => {
        serverInstance.close(() => {
          reject(err);
        });
      });

      req.end();
    });
  });
}

let portCounter = 3000;
function getAvailablePort(): number {
  return portCounter++;
}
