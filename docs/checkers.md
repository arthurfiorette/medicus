# Checkers

A **Checker** is a function responsible for assessing the health of a specific sub-service or component within your application. These functions can be either `async` or `sync` and must return one of the following:

- `void` (no value returned)
- An `Error` (to signal failure)
- A value from the `HealthStatus` enum
- A `DetailedHealthCheck` (for a more detailed response)

Each checker receives two parameters:

1. **`ctx`** - The context object (if configured)
2. **`signal`** - An `AbortSignal` that gets aborted when the checker times out

## Timeout Protection

By default, checkers have a timeout of **5 seconds** to complete their execution. If a checker exceeds this timeout, it will be automatically marked as `UNHEALTHY` with a timeout error in the debug information. This prevents slow or hanging checkers from blocking your health check process.

Each checker receives an `AbortSignal` as its second parameter that is aborted when the timeout is exceeded. You can pass this signal to APIs that support `AbortSignal` (like database clients, Redis, etc.) to gracefully cancel long-running operations.

```ts
import { Medicus, HealthStatus } from 'medicus';

const medicus = new Medicus({
  checkerTimeoutMs: 10_000, // 10 seconds (default is 5 seconds)
  checkers: {
    async database(ctx, signal) {
      // Pass the signal to automatically cancel the query if it times out
      await ctx.db.query('SELECT 1', { signal });
      return HealthStatus.HEALTHY;
    }
  }
});
```

## Throwing Errors

To indicate that a service is unhealthy, you can throw an error inside your checker function. This method only signals failure (unhealthy state) and does not support the `DEGRADED` status.

```ts
medicus.addChecker({
  // Async support is optional
  service(ctx, signal) {
    if (ctx.hasError) {
      // This error will be logged via the errorLogger
      throw ctx.error;
    }
  }
});
```

## Using `HealthStatus`

For simpler health status checks, you can directly return a value from the `HealthStatus` enum.

```ts
import { HealthStatus } from 'medicus';

medicus.addChecker({
  service(ctx, signal) {
    if (ctx.hasError) {
      return HealthStatus.UNHEALTHY;
    }

    if (ctx.isBusy) {
      return HealthStatus.DEGRADED;
    }

    return HealthStatus.HEALTHY;
  }
});
```

## Detailed Result

When using the [debug view](./debug-view.md), you can return more detailed information alongside the health status. This is particularly helpful when you want to provide additional context, such as messages, version information, or any other relevant data for debugging.

```ts
import { HealthStatus } from 'medicus';

medicus.addChecker({
  service(ctx, signal) {
    return {
      status: HealthStatus.HEALTHY,
      debug: {
        message: 'Everything is fine',
        foo: 'bar',
        version: ctx.serviceVersion
      }
    };
  }
});
```

<details>
<summary>Health Check Result Example</summary>

When calling `await medicus.performCheck(true)` with debugging enabled, you'll receive the following output:

```json
{
  "status": "unhealthy",
  "services": {
    "service": {
      "status": "healthy",
      "debug": {
        "message": "Everything is fine",
        "foo": "bar",
        "version": "1.0.0"
      }
    },
    "database": {
      "status": "unhealthy",
      "debug": {
        "error": "Connection refused"
      }
    },
    "slowChecker": {
      "status": "unhealthy",
      "debug": {
        "timeout": true,
        "error": "Health check timed out"
      }
    }
  }
}
```

</details>
