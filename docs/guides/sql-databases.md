---
title: PostgreSQL & MySQL Health Checks in Node.js
description: 'Database health checks for Node.js: SELECT 1 with pg, mysql2, Prisma, Drizzle and Kysely, pool saturation detection and query timeouts.'
---

# SQL Databases

The universal SQL health check for PostgreSQL, MySQL, SQLite or any other database reachable from Node.js is `SELECT 1`: it proves the process can acquire a connection, reach the server, authenticate and execute a query without touching any table. Anything the driver throws (connection refused, auth failure, pool exhausted) marks the service unhealthy automatically.

## Basic checker

```ts
medicus.addChecker({
  async database(ctx, signal) {
    await ctx.db.query('SELECT 1', { signal });
  }
});
```

The equivalent Postgres or MySQL health check one-liner for common Node.js clients:

| Client       | Query                            |
| ------------ | -------------------------------- |
| pg           | `pool.query('SELECT 1')`         |
| mysql2       | `pool.query('SELECT 1')`         |
| Kysely       | `` sql`SELECT 1`.execute(db) ``  |
| Drizzle      | `` db.execute(sql`SELECT 1`) ``  |
| Prisma       | `` prisma.$queryRaw`SELECT 1` `` |

Name the checker after the dependency (`database`, `analyticsDb`, ...), since the name becomes the key under `services` in the [health result](../get-started.md#health-result).

## Timeouts

A saturated pool is the classic silent failure: `SELECT 1` never errors, it just waits forever for a free connection, and your health check hangs with it. Two defenses, use both:

1. Medicus' [checker timeout](../checkers.md#timeout-protection) guarantees a verdict: after `checkerTimeoutMs` (5 seconds by default) the check is marked unhealthy with a timeout error.
2. Pass the checker's `AbortSignal` to the driver so the query is actually cancelled instead of leaking. For drivers without signal support, configure a connection acquisition timeout (e.g. `connectionTimeoutMillis` in pg) so the query rejects instead of queueing.

## Pool statistics as debug info

The pool reports pressure *before* it becomes an outage. Surface its counters through the [debug view](../debug-view.md) and flag saturation as degraded:

```ts
import { HealthStatus } from 'medicus';

medicus.addChecker({
  async database(ctx, signal) {
    await ctx.db.query('SELECT 1', { signal });

    // Clients queueing for a connection = pool under pressure
    const saturated = ctx.db.pool.waitingCount > 0;

    return {
      status: saturated ? HealthStatus.DEGRADED : HealthStatus.HEALTHY,
      debug: {
        totalConnections: ctx.db.pool.totalCount,
        idleConnections: ctx.db.pool.idleCount,
        waitingRequests: ctx.db.pool.waitingCount
      }
    };
  }
});
```

## Multiple databases

One checker per connection, so the health result pinpoints which one is down:

```ts
medicus.addChecker({
  async primaryDb(ctx, signal) {
    await ctx.primary.query('SELECT 1', { signal });
  },
  async replicaDb(ctx, signal) {
    await ctx.replica.query('SELECT 1', { signal });
  }
});
```

Multiple *schemas* in one physical database share one connection pool, so a single checker is enough.

::: tip Keep it `SELECT 1`
Avoid table reads (couples health to schema and data size), migration status checks (a pending migration would turn every rollout into an outage) and writes (breaks on read-only replicas). The health check answers one question: can this process use the database right now?
:::
