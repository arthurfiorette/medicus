---
title: Express Health Check Handler
description: Add a typed health check route to Express 4.21+ or 5.2+ with request context, HTTP status mapping, debug output and cached checks.
---

# Express <Badge type="warning" text="Third-Party" />

Attach `createExpressHealthCheckHandler` to a GET route. Checkers receive the current Express `Request` as their context:

```ts
import express from 'express';
import { HealthStatus } from 'medicus';
import { createExpressHealthCheckHandler } from 'medicus/express';

const app = express();
app.get(
  '/health',
  createExpressHealthCheckHandler({
    checkers: {
      database(req) {
        console.log(`Health check from ${req.ip}`);
        return HealthStatus.HEALTHY;
      }
    }
  })
);
```

The handler exposes its `Medicus` instance for late checker registration and shutdown:

```ts
import express from 'express';
import { createExpressHealthCheckHandler } from 'medicus/express';

const app = express();
const health = createExpressHealthCheckHandler();
app.get('/health', health);
const server = app.listen(3000);

process.on('SIGTERM', () => {
  health.medicus.stopBackgroundCheck();
  server.close();
});
```

Express does not own an application shutdown lifecycle, so stop background checks in the same shutdown handler that closes your HTTP server and other resources.

## Query Parameters

- `?debug=true` - Include checker details.
- `?last=true` - Return the last cached result, or run a check if none exists.
- `?simulate=healthy|degraded|unhealthy` - Override the returned status for testing.

Healthy and degraded results return `200`; unhealthy results return `503`. Responses default to `Content-Type: application/json; charset=utf-8` and `Cache-Control: no-cache, no-store, must-revalidate`.

## Options

`createExpressHealthCheckHandler` accepts all `Medicus` constructor options except `context`, plus:

- `debug?: boolean` - Include checker details by default.
- `headers?: Record<string, string>` - Add or override response headers.

See the [Express middleware guide](https://expressjs.com/en/guide/using-middleware.html) and [health check and graceful shutdown guide](https://expressjs.com/en/advanced/healthcheck-graceful-shutdown.html).
