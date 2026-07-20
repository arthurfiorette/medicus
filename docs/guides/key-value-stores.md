# Key-Value Stores

Redis, Valkey, Memcached, DynamoDB, Cloudflare KV — the health check pattern is the same for all of them: perform the cheapest possible operation and let the promise settle. If it resolves, the service is healthy; if it rejects, Medicus marks it unhealthy and forwards the error to the [error logger](../logger.md).

## Basic checker

Clients with a dedicated ping command (Redis, Valkey, Memcached) make this a one-liner:

```ts
medicus.addChecker({
  async redis(ctx) {
    await ctx.redis.ping();
  }
});
```

With the [Fastify integration](../integrations/fastify.md), the checker context is the Fastify instance itself, so a client registered via `@fastify/redis` is directly available as `ctx.redis`.

## Stores without a ping command

Managed and HTTP-based stores (Cloudflare KV, DynamoDB, Upstash REST) usually have no `PING`. A cheap read works just as well — it proves connectivity, authentication and authorization, even when the key doesn't exist:

```ts
medicus.addChecker({
  async kv(ctx) {
    // A missing key resolves to null — that still proves
    // the store is reachable and credentials are valid
    await ctx.kv.get('healthcheck');
  }
});
```

## Read-after-write round trips

A ping proves the server answers — not that your process can *write*. Stores can be reachable yet reject writes (out of memory, read-only replica, exceeded quota). When writes matter, do a small round trip on a dedicated key:

```ts
medicus.addChecker({
  async cache(ctx) {
    const key = 'medicus:healthcheck';

    // Always set a TTL so failed checks never leak keys
    await ctx.cache.set(key, '1', { ttl: 60 });

    if ((await ctx.cache.get(key)) !== '1') {
      throw new Error('Cache read-after-write mismatch');
    }
  }
});
```

Prefer the plain ping/read unless you have a reason: round trips cost more, and on stores billed per operation they add up at probe frequency.

## Hanging commands and timeouts

Depending on client configuration, a command sent while the connection is down may **hang waiting for a reconnect** instead of rejecting — for example, ioredis with `maxRetriesPerRequest: null`, which is required by BullMQ.

Medicus' [checker timeout](../checkers.md#timeout-protection) is the safety net: after `checkerTimeoutMs` (5 seconds by default) the check is marked unhealthy instead of blocking the whole health report.

```ts
import { Medicus } from 'medicus';

const medicus = new Medicus<YourContext>({
  checkerTimeoutMs: 2_000,
  checkers: {
    async redis(ctx) {
      await ctx.redis.ping();
    }
  }
});
```

## Latency-based degraded status

The binary pass/throw checker covers most cases. To surface slowness before it becomes an outage, measure the round trip and return [`DEGRADED`](../checkers.md#using-healthstatus):

```ts
import { HealthStatus } from 'medicus';

medicus.addChecker({
  async redis(ctx) {
    const start = performance.now();
    await ctx.redis.ping();
    const latency = Math.round(performance.now() - start);

    return {
      status: latency > 250 ? HealthStatus.DEGRADED : HealthStatus.HEALTHY,
      debug: { latency }
    };
  }
});
```

The `debug` payload only reaches clients when the [debug view](../debug-view.md) is enabled, so exposing internals here is safe.

::: tip Check the client you actually use
If a library creates its own connection (session stores, queues, idempotency adapters), pinging your main client says nothing about it. Either share one connection or register one checker per client.
:::
