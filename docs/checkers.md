# Checkers

A **Checker** is a function responsible for assessing the health of a specific sub-service or component within your application. These functions can be either `async` or `sync` and must return one of the following:

- `void` (no value returned)
- An `Error` (to signal failure)
- A value from the `HealthStatus` enum
- A `DetailedHealthCheck` (for a more detailed response)

## Timeout Protection

By default, checkers have a timeout of **5 seconds** to complete their execution. If a checker exceeds this timeout, it will be automatically marked as `UNHEALTHY` with a timeout error in the debug information. This prevents slow or hanging checkers from blocking your health check process.

You can customize the timeout duration by setting the `checkerTimeoutMs` option when creating a Medicus instance:

```ts
import { Medicus } from 'medicus';

const medicus = new Medicus({
  checkerTimeoutMs: 10_000, // 10 seconds
  checkers: {
    slowService(ctx) {
      // This checker has up to 10 seconds to complete
      return performSlowCheck();
    }
  }
});
```

## Throwing Errors

To indicate that a service is unhealthy, you can throw an error inside your checker function. This method only signals failure (unhealthy state) and does not support the `DEGRADED` status.

```ts
medicus.addChecker({
  // Async support is optional
  service(ctx) {
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
  service(ctx) {
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
  service(ctx) {
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
  "status": "healthy",
  "services": {
    "service": {
      "status": "healthy",
      "debug": {
        "message": "Everything is fine",
        "foo": "bar",
        "version": "1.0.0"
      }
    }
  }
}
```

</details>
