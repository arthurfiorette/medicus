# Next.js <Badge type="warning" text="Third-Party" />

Health check integration for Next.js applications, supporting both App Router and Pages Router.

## App Router (Recommended)

For Next.js 13+ with App Router:

```ts
// app/api/health/route.ts
import { HealthStatus } from 'medicus';
import { createNextHealthCheckHandler } from 'medicus/nextjs';

export const GET = createNextHealthCheckHandler({
  checkers: {
    database: () => HealthStatus.HEALTHY
  }
});
```

### With Conditional Debug

Show debug information only for authorized requests:

```ts
export const GET = createNextHealthCheckHandler({
  checkers: {
    database: () => HealthStatus.HEALTHY
  },
  debug: (req) => req.headers.get('authorization') === 'Bearer secret-token'
});
```

### With Custom Headers

```ts
export const GET = createNextHealthCheckHandler({
  checkers: {
    database: () => HealthStatus.HEALTHY
  },
  headers: {
    'x-custom-header': 'value'
  }
});
```

## Pages Router

For legacy Pages Router:

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

## Query Parameters

Both handlers support these query parameters:

- `?debug=true` - Include debug information in response
- `?last=true` - Return the last cached health check result
- `?simulate=healthy|degraded|unhealthy` - Simulate a specific health status

## Options

```ts
interface NextHealthCheckOptions {
  // Include debug info by default (boolean) or conditionally (function)
  debug?: boolean | ((req) => boolean | Promise<boolean>);
  
  // Custom response headers (merged with defaults)
  headers?: Record<string, string>;
}
```

Default headers:
- `content-type: application/json; charset=utf-8`
- `cache-control: no-cache, no-store, must-revalidate`

## Status Codes

- `200 OK` - Service is healthy or degraded
- `503 Service Unavailable` - Service is unhealthy
