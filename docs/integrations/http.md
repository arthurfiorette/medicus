# HTTP Integration

The HTTP integration provides a request handler for Node.js HTTP servers.

## Basic Usage

```ts
import { createServer } from 'node:http';
import { Medicus, HealthStatus } from 'medicus';
import { createHttpHealthCheckHandler } from 'medicus/integrations/http';

const medicus = new Medicus({
  checkers: {
    database: () => HealthStatus.HEALTHY
  }
});

const handleHealthCheck = createHttpHealthCheckHandler(medicus);

const server = createServer((req, res) => {
  if (req.url?.startsWith('/health')) {
    // Preferred approach using URL constructor
    const url = new URL(req.url, `http://${req.headers.host}`);
    return handleHealthCheck(url.searchParams, res);
    
    // Alternative: direct URLSearchParams parsing
    // const searchParams = new URLSearchParams(req.url.split('?')[1] || '');
    // return handleHealthCheck(searchParams, res);
  }

  // Handle other routes...
});
```

## With Avvio

```ts
import avvio from 'avvio';
import { createServer } from 'node:http';
import { avvioMedicusPlugin } from 'medicus/integrations/avvio';
import { createHttpHealthCheckHandler } from 'medicus/integrations/http';

const app = avvio({});

app.use(
  avvioMedicusPlugin({
    checkers: {
      service: () => HealthStatus.HEALTHY
    }
  })
);

app.ready(() => {
  const handleHealthCheck = createHttpHealthCheckHandler(app.medicus);

  const server = createServer((req, res) => {
    if (req.url?.startsWith('/health')) {
      const url = new URL(req.url, `http://${req.headers.host}`);
      return handleHealthCheck(url.searchParams, res);
    }
  });
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
  headers?: Record<string, string>; // Custom headers
}
```
