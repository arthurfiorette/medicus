---
title: Elysia Health Check Route
description: Add a health check endpoint to Elysia with a route handler that passes the request context to your checkers.
---

# Elysia <Badge type="warning" text="Third-Party" />

Attach `createElysiaHealthCheckHandler` to a route. Checkers receive the Elysia `Context` as their context:

```ts
import { Elysia } from 'elysia';
import { HealthStatus } from 'medicus';
import { createElysiaHealthCheckHandler } from 'medicus/elysia';

const app = new Elysia()
  .get(
    '/health',
    createElysiaHealthCheckHandler({
      checkers: {
        database(context) {
          console.log(context.request.url);
          return HealthStatus.HEALTHY;
        }
      }
    })
  )
  .listen(3000);
```

The handler exposes its Medicus instance as `handler.medicus`. Call `handler.medicus.stopBackgroundCheck()` on shutdown if you enable `backgroundCheckInterval`.

## Query Parameters

- `?debug` - Include debug information
- `?last` - Return cached result
- `?simulate=unhealthy|degraded|healthy` - Simulate status

Healthy and degraded results return `200`, unhealthy results return `503`. Responses default to `Content-Type: application/json; charset=utf-8` and `Cache-Control: no-cache, no-store, must-revalidate`.

## Options

`createElysiaHealthCheckHandler` accepts every `Medicus` option except `context`, plus:

```ts
interface ElysiaHealthCheckOptions {
  debug?: boolean; // Include debug info by default
  headers?: Record<string, string>; // Add or override response headers
}
```

For more details about Elysia, visit the [Elysia documentation](https://elysiajs.com/).
