---
title: TanStack Start Health Check Handler
description: Type-safe health check server function for TanStack Start, plus a public HTTP endpoint pattern for uptime monitors and load balancers.
---

# TanStack Start <Badge type="warning" text="Third-Party" />

TanStack Start is a full-stack React (and Solid) framework built on TanStack Router. Its [server functions](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions) are type-safe RPC endpoints that run only on the server.

Medicus provides a server function handler through `createTanStackStartHealthCheckHandler`. Since server functions are RPC endpoints (TanStack Start owns the HTTP response), the handler returns the `HealthCheckResult` directly instead of writing a response:

```ts
import { createServerFn } from '@tanstack/react-start';
import { HealthStatus } from 'medicus';
import { createTanStackStartHealthCheckHandler } from 'medicus/tanstack-start';

export const getHealth = createServerFn({ method: 'GET' }).handler(
  createTanStackStartHealthCheckHandler({
    checkers: {
      database: () => HealthStatus.HEALTHY
    }
  })
);
```

The integration has no dependency on `@tanstack/react-start` or `@tanstack/solid-start`; the handler is structurally compatible with `createServerFn().handler()` in both.

## Input Flags

To let callers toggle debug, cached, or simulated results, add a validator with the `TanStackStartHealthCheckInput` type:

```ts
import { createServerFn } from '@tanstack/react-start';
import { HealthStatus } from 'medicus';
import {
  createTanStackStartHealthCheckHandler,
  type TanStackStartHealthCheckInput
} from 'medicus/tanstack-start';

export const getHealth = createServerFn({ method: 'GET' })
  .validator((data?: TanStackStartHealthCheckInput) => data)
  .handler(
    createTanStackStartHealthCheckHandler({
      checkers: {
        database: () => HealthStatus.HEALTHY
      }
    })
  );

// from a loader, component or another server function
const result = await getHealth({ data: { debug: true } });
```

- `debug: true` - Include debug information in the result
- `last: true` - Return the last cached health check result
- `simulate: 'healthy' | 'degraded' | 'unhealthy'` - Simulate a specific health status

The `simulate` value is re-validated inside the handler, so invalid values coming over the network are ignored.

## Checker Context

Checkers receive the server function context (`{ data, context, ... }`) as the Medicus context. Checkers also receive an `AbortSignal` from Medicus itself as their second argument, tied to the checker timeout. If you use middleware that provides a typed `context`, pass your context type as the generic parameter:

```ts
import { HealthStatus } from 'medicus';
import {
  createTanStackStartHealthCheckHandler,
  type TanStackStartServerFnCtx
} from 'medicus/tanstack-start';

interface HealthCtx extends TanStackStartServerFnCtx {
  context: {
    db: { healthCheck(): Promise<void> };
  };
}

const handler = createTanStackStartHealthCheckHandler<HealthCtx>({
  checkers: {
    async database(ctx) {
      await ctx.context.db.healthCheck();
      return HealthStatus.HEALTHY;
    }
  }
});
```

## Accessing the Medicus Instance

The underlying `Medicus` instance is exposed on the handler, useful to register checkers later or to stop background checks on shutdown:

```ts
import { HealthStatus } from 'medicus';
import { createTanStackStartHealthCheckHandler } from 'medicus/tanstack-start';

const handler = createTanStackStartHealthCheckHandler();

handler.medicus.addChecker({
  cache: () => HealthStatus.HEALTHY
});

// on shutdown
handler.medicus.stopBackgroundCheck();
```

`backgroundCheckInterval` is only suitable when deploying to a long-lived Node.js server. On serverless or edge targets (Vercel, Netlify, Cloudflare Workers), instances are short-lived, so keep background checks disabled.

## External Monitoring

Server functions are same-origin RPC endpoints intended to be called by your own application; TanStack Start protects them with CSRF middleware by default (unless you define a custom `createStart` instance and omit it). For uptime monitors or load balancers that need a public HTTP endpoint with proper `200`/`503` status codes, expose a [server route](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes) instead and reuse the same instance via `handler.medicus.performCheck()`.

Note that `performCheck()` called without an argument runs checkers without the server function context, so checkers reused this way must tolerate a missing context.

## Options

```ts
import { HealthChecker } from 'medicus';

interface TanStackStartHealthCheckOptions {
  checkers?: Record<string, HealthChecker>; // Medicus checkers
  debug?: boolean; // Include debug info by default
}
```

All other `Medicus` constructor options (except `context`) are also accepted.

For more details about TanStack Start, visit the [TanStack Start documentation](https://tanstack.com/start).
