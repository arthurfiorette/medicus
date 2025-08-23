# HTTP Integration

The HTTP integration provides a request handler for Node.js HTTP servers.

## Basic Usage

```ts
import { createServer } from 'node:http';
import { Medicus, HealthStatus } from 'medicus';
import { createHttpHealthCheckHandler } from 'medicus/http';

const medicus = new Medicus({
  checkers: {
    database: () => HealthStatus.HEALTHY
  }
});

const handleHealthCheck = createHttpHealthCheckHandler(medicus);

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '', `http://${req.headers.host}`);

  if (url.pathname === '/health') {
    return handleHealthCheck(url.searchParams, res);
  }

  // Handle other routes...
});
```

## Query Parameters

- `?debug` - Include debug information
- `?last` - Return cached result
- `?simulate=unhealthy|degraded|healthy` - Simulate status

## Options

```ts
interface HttpHealthCheckOptions {
  debug?: boolean; // Include debug info by default
  headers?: Record<string, string>; // Custom headers (includes cache prevention by default)
}
```
