# Logger

Medicus provides robust support for logging during health checks. You can configure custom logger functions to centralize and customize logging for your system.

## Error Logger

The `errorLogger` is called whenever an error occurs during health check execution, whether in an **automatic background check** or during a **manual check**.

### Custom Error Logger

The `errorLogger` receives the error and the name of the checker where it occurred, making it easy to integrate your logging solution.

```ts
import { Medicus } from 'medicus';

const medicus = new Medicus({
  // Custom error handling implementation
  errorLogger(error, checkerName) {
    console.log('Health check failed:', checkerName, error);
  }
});
```

### Default Error Logger

If no custom error logger is provided, Medicus uses a default implementation based on `console.error`. This is sufficient for development environments but can be replaced with a more robust solution for production.

```ts
import { MedicusErrorLogger } from 'medicus';

export const defaultErrorLogger: MedicusErrorLogger = (
  error,
  checkerName
) => {
  console.error(`Health check failed for ${checkerName}`, error);
};
```

## Unhealthy Logger

The `unhealthyLogger` is called whenever a health check completes with a non-healthy status (either `DEGRADED` or `UNHEALTHY`). This is useful for monitoring and alerting when your system is experiencing issues.

### Custom Unhealthy Logger

The `unhealthyLogger` receives the complete health check result, including all service details and the overall status.

```ts
import { Medicus } from 'medicus';

const medicus = new Medicus({
  // Custom unhealthy status handler
  unhealthyLogger(details) {
    console.warn('System health degraded:', {
      status: details.status,
      services: details.services
    });
  }
});
```

### When is it Called?

The `unhealthyLogger` is triggered after a health check completes if:
- The overall status is `UNHEALTHY`, or
- The overall status is `DEGRADED`

It is **not** called when the status is `HEALTHY`.

### Use Cases

Common use cases for the unhealthy logger include:

- **Alerting**: Send notifications to your team when services are degraded
- **Metrics**: Record degraded/unhealthy states to monitoring systems
- **Audit trails**: Log system health issues for later analysis
- **Auto-remediation**: Trigger automated recovery actions

```ts
import { Medicus, HealthStatus } from 'medicus';

const medicus = new Medicus({
  unhealthyLogger(details) {
    // Send alert if system is completely unhealthy
    if (details.status === HealthStatus.UNHEALTHY) {
      console.error('CRITICAL: System is unhealthy', details);
      // alertingService.critical('System is unhealthy', details);
    }

    // Log degraded services for monitoring
    if (details.status === HealthStatus.DEGRADED) {
      console.warn('WARNING: System is degraded', details.services);
      // metricsService.recordDegradation(details.services);
    }
  }
});
```

## Integrations

### Pino

Medicus supports integration with [Pino](./integrations/pino.md), a high-performance JSON logger that can be used for both error logging and unhealthy status logging.

## Custom Integrations

Do you need to integrate another logging tool or a custom solution? Medicus is designed to be flexible, letting you add your own loggers with ease.

Have a great implementation you'd like to share? [Contribute to Medicus](https://github.com/arthurfiorette/medicus/pulls) by opening a pull request!
