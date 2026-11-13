---
title: Elysia Health Check Handler
description: Add a Medicus health check handler to any user-defined Elysia route with typed request context and explicit lifecycle ownership.
---

# Elysia <Badge type="warning" text="Third-Party" />

Attach the handler to your health route. Medicus does not register the path automatically:

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

Checkers receive the current Elysia request context. `/health` is only the conventional example; the application owns the route path.

## Query Parameters

- `?debug=true` - Include checker details.
- `?last=true` - Return the last cached result, or run a check if none exists.
- `?simulate=healthy|degraded|unhealthy` - Override the returned status for testing.

Healthy and degraded results return `200`; unhealthy results return `503`. Responses default to `Content-Type: application/json; charset=utf-8` and `Cache-Control: no-cache, no-store, must-revalidate`.

## Options

`createElysiaHealthCheckHandler` accepts all `Medicus` constructor options except `context`, plus:

- `debug?: boolean` - Include checker details by default.
- `headers?: Record<string, string>` - Add or override response headers.

See the Elysia documentation for [routes](https://elysiajs.com/essential/route.html) and [testing with `app.handle`](https://elysiajs.com/patterns/unit-test.html).
