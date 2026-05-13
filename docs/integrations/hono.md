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
The underlying Medicus instance is created with `context: null` and each request passes `c` per check.

You can use `MedicusVariables` to type-safe `c.set('medicus', ...)` / `c.get('medicus')`:

```ts
import type { MedicusVariables } from 'medicus/hono';

type AppEnv = MedicusVariables;
```

The health handler does `c.set('medicus', medicus)` so other middleware/routes can read the same instance from request context.

## Edge Runtime Note

On edge runtimes (for example Cloudflare Workers), application instances are typically spun up per request.
Because of that lifecycle, background checks are not suitable and should remain disabled (`backgroundCheckInterval` unset).

## Query Parameters

- `?debug` - Include debug information
- `?last` - Return cached result
- `?simulate=unhealthy|degraded|healthy` - Simulate status

## Options

```ts
import { HealthChecker } from 'medicus';

interface HonoHealthCheckOptions {
  checkers?: Record<string, HealthChecker>; // Medicus checkers
  debug?: boolean; // Include debug info by default
  headers?: Record<string, string>; // Custom response headers
}
```

For more details about Hono, visit the [Hono documentation](https://hono.dev/).
