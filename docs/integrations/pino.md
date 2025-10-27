# Pino

Pino is a fast and lightweight JSON logger designed for both development and production environments. It offers structured logging with advanced features for enhanced debugging and monitoring.

The `pinoMedicusPlugin` allows you to integrate Pino into `Medicus`, providing structured logging for both errors and unhealthy status events.

```ts
import { Medicus } from 'medicus';
import { pinoMedicusPlugin } from 'medicus/pino';
import { pino } from 'pino';

const pinoInstance = pino();

// Configure Medicus to use Pino for logging
const medicus = new Medicus({
  plugins: [pinoMedicusPlugin(pinoInstance)]
});
```

## What Gets Logged

The Pino plugin automatically configures both logging functions:

### Error Logger

When a health checker throws an error, it will be logged using `pino.error()` with the error object and checker name.

### Unhealthy Logger

When a health check completes with a `DEGRADED` or `UNHEALTHY` status, it will be logged using `pino.fatal()` with all service details and the overall system status.

This integration ensures that all errors and health status changes produced by `Medicus` are formatted and processed using Pino's structured logging.

For additional details about Pino, visit the [Pino documentation](https://getpino.io).
