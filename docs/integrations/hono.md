# Hono <Badge type="warning" text="Third-Party" />

Hono is a small, fast, and standards-based web framework that runs on Node.js and edge runtimes.

You can integrate Medicus with your Hono application by attaching the `createHonoHealthCheckHandler` to a route:

```ts
import { Hono } from 'hono';
import { HealthStatus } from 'medicus';
import { createHonoHealthCheckHandler } from 'medicus/hono';

const app = new Hono();

app.get(
  '/health',
  createHonoHealthCheckHandler({
    checkers: {
      database: () => HealthStatus.HEALTHY
    }
  })
);
```

By default, checkers receive the current Hono request context (`c`) as the Medicus context.

## Query Parameters

- `?debug` - Include debug information
- `?last` - Return cached result
- `?simulate=unhealthy|degraded|healthy` - Simulate status

## Options

```ts
interface HonoHealthCheckOptions {
  checkers?: Record<string, HealthChecker>; // Medicus checkers
  context?: unknown; // Optional explicit context override
  debug?: boolean; // Include debug info by default
  headers?: Record<string, string>; // Custom response headers
}
```

For more details about Hono, visit the [Hono documentation](https://hono.dev/).
