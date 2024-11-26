# Debug View

Medicus allows you to include detailed debugging information for health checkers that return [detailed results](./checkers.md#detailed-result). By default, this debugging data is not included in the check results, but you can enable it by setting the `debug` option to `true`.

This is particularly useful for troubleshooting or gathering additional insights into why a service or checker is reporting a particular status.

```ts
import { Medicus, HealthStatus } from 'medicus';

const medicus = new Medicus({
  checkers: {
    service() {
      return {
        status: HealthStatus.HEALTHY,
        debug: {
          foo: 'bar'
        }
      };
    }
  }
});
```

### With Debugging Enabled

When debugging is enabled (via `true`), the resulting check output will include the debug information returned by each checker.

```ts
await medicus.performCheck(true);

const result = {
  status: 'HEALTHY',
  services: {
    service: {
      status: 'HEALTHY',
      debug: {
        foo: 'bar'
      }
    }
  }
};
```

### With Debugging Disabled

If debugging is disabled (or not explicitly enabled), the output will omit the debug details, providing a cleaner result.

```ts
await medicus.performCheck();

const result = {
  status: 'HEALTHY',
  services: {}
};
```
