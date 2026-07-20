# Background Workers

Queue consumers, cron runners and schedulers depend on databases and brokers just like any API — but there is no HTTP server to attach a health route to.

Medicus works without a web framework. For these processes, the strategy changes from **pull** (an orchestrator polls an endpoint) to **push**: the process checks itself on an interval and reports the result somewhere.

## Background checks + logging

The simplest setup: enable [background checks](../background-checks.md) and log every failure through the [error logger](../logger.md). Problems become visible in your log pipeline without any HTTP surface.

```ts
import { Medicus } from 'medicus';
import { nodeMedicusPlugin } from 'medicus/node';

const medicus = new Medicus<YourContext>({
  plugins: [nodeMedicusPlugin()],
  checkers: {
    async database(ctx, signal) {
      await ctx.db.query('SELECT 1', { signal });
    }
  },
  // Checks itself every 60s, no one needs to call performCheck()
  backgroundCheckInterval: 60_000
});
```

## Uptime monitoring with heartbeats

Logs tell you a check failed — they don't tell you the process **died**. A crashed worker logs nothing.

Heartbeat monitoring inverts the model: the worker pings an uptime monitor (such as [healthchecks.io](https://healthchecks.io/), [Better Stack](https://betterstack.com/) or [Cronitor](https://cronitor.io/)) **only when healthy**, and the monitor alerts when pings *stop arriving*. This "dead man's switch" covers both failure modes with one mechanism: a failing checker and a dead process both go silent.

```ts
import { Medicus, HealthStatus } from 'medicus';

const medicus = new Medicus({
  backgroundCheckInterval: 60_000,
  async onBackgroundCheck(check) {
    // Skipping the heartbeat is the alert: the monitor
    // fires once the ping goes missing
    if (check.status !== HealthStatus.HEALTHY) {
      return;
    }

    const response = await fetch(process.env.HEARTBEAT_URL!);

    // 429 can happen when intervals drift and pings overlap;
    // it is not worth alerting on
    if (response.status !== 200 && response.status !== 429) {
      console.error('Heartbeat rejected', response.status);
    }
  }
});
```

Errors thrown inside `onBackgroundCheck` are forwarded to the [error logger](../logger.md#error-logger), so a temporarily unreachable monitor won't crash the worker.

### Tuning the interval

Set the monitor's grace period to tolerate at least one missed ping (e.g. alert after 2–3 × `backgroundCheckInterval`), otherwise a single slow check triggers false alarms.

Deploys are the other flapping source: a restart resets the timer, delaying the first ping by a full interval. Medicus runs a check immediately on startup by default ([`eagerBackgroundCheck`](../background-checks.md#immediate-execution-with-eagerbackgroundcheck)), which keeps the heartbeat gap during a rollout as small as possible.

## Minimal HTTP endpoint

If your orchestrator requires a pollable probe (Kubernetes `livenessProbe`, Docker `HEALTHCHECK`), the [HTTP integration](../integrations/http.md) exposes one endpoint with a bare `node:http` server — no framework needed:

```ts
import { createServer } from 'node:http';
import { createHttpHealthCheckHandler } from 'medicus/http';

const handleHealthCheck = createHttpHealthCheckHandler(medicus);

// Internal port, not exposed publicly
createServer((req, res) => {
  const url = new URL(req.url ?? '', `http://${req.headers.host}`);

  if (url.pathname === '/health') {
    return handleHealthCheck(url.searchParams, res);
  }

  res.writeHead(404).end();
}).listen(3002);
```

Combined with background checks, the endpoint can serve the cached result via `?last` instead of re-running every checker on each probe.

## Using an existing plugin system

If the worker is already built on a plugin system, prefer the matching integration — it handles registration, context typing and stopping the background timer on shutdown:

- [Avvio](../integrations/avvio.md) — `avvioMedicusPlugin` for plain avvio applications.
- [Fastify](../integrations/fastify.md) with `route: false` — some workers use Fastify purely as a dependency-injection container without ever calling `listen()`; this registers checkers and background checks without exposing any route.

## Graceful shutdown

The background check timer is `unref()`'d, so it never keeps the process alive — no cleanup is required just to exit.

Still, stop it first in your shutdown handler: teardown takes time, and a check firing mid-shutdown runs checkers against half-closed connections — producing spurious unhealthy logs, or a skipped heartbeat right as the worker cleanly restarts. The integrations above already do this through their close hooks.

When using the `Medicus` class directly, [`close-with-grace`](https://github.com/mcollina/close-with-grace) is a good fit for workers: it listens for `SIGINT`/`SIGTERM`, `uncaughtException` and `unhandledRejection`, and force-exits if cleanup exceeds a delay — so a hung database connection can't keep a dying worker alive forever.

```ts
import closeWithGrace from 'close-with-grace';

closeWithGrace({ delay: 10_000 }, async ({ err }) => {
  if (err) {
    console.error(err);
  }

  // Silence health checks before tearing anything down
  medicus.stopBackgroundCheck();

  // Then close your queues, database connections, etc.
});
```
