# Pino

Pino is a fast and lightweight JSON logger designed for both development and production environments. It offers structured logging with advanced features for enhanced debugging and monitoring.

The `pinoMedicusPlugin` allows you to integrate Pino into `Medicus`, replacing its default error logger with Pino's powerful logging capabilities.

```ts
import { Medicus } from 'medicus';
import { pinoMedicusPlugin } from 'medicus/pino';
import { pino } from 'pino';

const pinoInstance = pino();

// Configure Medicus to use Pino for error logging
const medicus = new Medicus({
  plugins: [pinoMedicusPlugin(pinoInstance)]
});
```

This integration ensures that all errors and diagnostic logs produced by `Medicus` are formatted and processed using Pino's structured logging.

For additional details, visit the [Pino documentation](https://getpino.io).
