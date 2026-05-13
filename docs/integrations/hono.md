# Hono <Badge type="warning" text="Third-Party" />

Hono is a small, fast, and standards-based web framework that runs on Node.js and edge runtimes.

You can integrate Medicus with your Hono application by attaching the `createHonoHealthCheckHandler` to a route:

```ts
import { Hono } from 'hono';
import { Medicus, HealthStatus } from 'medicus';
import { createHonoHealthCheckHandler } from 'medicus/hono';

const app = new Hono();

const medicus = new Medicus({
  checkers: {
    database: () => HealthStatus.HEALTHY
  }
});

app.get('/health', createHonoHealthCheckHandler(medicus));
```

## Query Parameters

- `?debug` - Include debug information
- `?last` - Return cached result
- `?simulate=unhealthy|degraded|healthy` - Simulate status

## Options

```ts
interface HonoHealthCheckOptions {
  debug?: boolean; // Include debug info by default
  headers?: Record<string, string>; // Custom response headers
}
```

For more details about Hono, visit the [Hono documentation](https://hono.dev/).
