---
title: Next.js Health Check Route
description: Add a health check endpoint to Next.js with an App Router route handler or a Pages Router API route.
---

# Next.js <Badge type="warning" text="Third-Party" />

Medicus has handlers for both Next.js routers. Neither imports `next`, and checkers receive the incoming request as their context.

## App Router

Export `createNextHealthCheckHandler` as the `GET` handler of a route:

```ts
// app/health/route.ts
import { HealthStatus } from 'medicus';
import { createNextHealthCheckHandler } from 'medicus/nextjs';

export const GET = createNextHealthCheckHandler({
  checkers: {
    database(req) {
      console.log(req.url);
      return HealthStatus.HEALTHY;
    }
  }
});
```

Checkers receive a standard `Request`. Use `createNextHealthCheckHandler<NextRequest>(...)` to type it as a `NextRequest`.

## Pages Router

Export `createNextPagesHealthCheckHandler` from an API route:

```ts
// pages/api/health.ts
import { HealthStatus } from 'medicus';
import { createNextPagesHealthCheckHandler } from 'medicus/nextjs';

export default createNextPagesHealthCheckHandler({
  checkers: {
    database: () => HealthStatus.HEALTHY
  }
});
```

Checkers receive a Node.js `IncomingMessage`. Use `createNextPagesHealthCheckHandler<NextApiRequest>(...)` to type it as a `NextApiRequest`.

## Conditional Debug

`debug` also accepts a function. When it is set, the function alone decides whether the response includes debug information and `?debug` is ignored, so callers cannot bypass it:

```ts
import { createNextHealthCheckHandler } from 'medicus/nextjs';

export const GET = createNextHealthCheckHandler({
  debug: (req) => req.headers.get('authorization') === `Bearer ${process.env.HEALTH_TOKEN}`
});
```

## Query Parameters

- `?debug` - Include debug information, unless `debug` is a function
- `?last` - Return cached result
- `?simulate=unhealthy|degraded|healthy` - Simulate status

Healthy and degraded results return `200`, unhealthy results return `503`. Responses default to `Content-Type: application/json; charset=utf-8` and `Cache-Control: no-cache, no-store, must-revalidate`.

## Options

Both handlers accept every `Medicus` option except `context`, plus:

```ts
interface NextHealthCheckOptions<Req> {
  debug?: boolean | ((req: Req) => boolean | Promise<boolean>); // Include debug info
  headers?: Record<string, string>; // Add or override response headers
}
```

Background checks only fit long-running `next start` servers. Leave `backgroundCheckInterval` unset on serverless and edge deployments.

For more details, visit the Next.js documentation for [route handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) and [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes).
