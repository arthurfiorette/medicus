---
title: Express Health Check Route
description: Add a health check endpoint to Express 4 or 5 with a route handler that passes the request to your checkers.
---

# Express <Badge type="warning" text="Third-Party" />

Attach `createExpressHealthCheckHandler` to a route. Checkers receive the Express `Request` as their context:

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

Errors thrown outside checkers, such as by a custom `unhealthyLogger`, are passed to `next()` so your error middleware handles them on Express 4 and 5.

## Shutdown

Express has no shutdown hook. If you enable `backgroundCheckInterval`, stop it through `handler.medicus` when you close the server:

```ts
import express from 'express';
import { createExpressHealthCheckHandler } from 'medicus/express';

const app = express();
const health = createExpressHealthCheckHandler({ backgroundCheckInterval: 30_000 });

app.get('/health', health);

const server = app.listen(3000);

process.on('SIGTERM', () => {
  health.medicus.stopBackgroundCheck();
  server.close();
});
```

## Query Parameters

- `?debug` - Include debug information
- `?last` - Return cached result
- `?simulate=unhealthy|degraded|healthy` - Simulate status

Healthy and degraded results return `200`, unhealthy results return `503`. Responses default to `Content-Type: application/json; charset=utf-8` and `Cache-Control: no-cache, no-store, must-revalidate`.

## Options

`createExpressHealthCheckHandler` accepts every `Medicus` option except `context`, plus:

```ts
interface ExpressHealthCheckOptions {
  debug?: boolean; // Include debug info by default
  headers?: Record<string, string>; // Add or override response headers
}
```

For more details about Express, visit the [Express documentation](https://expressjs.com/).
