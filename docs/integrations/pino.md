# Pino

Pino is a high-performance JSON logger that works well in development and production environments and provides enhanced logging capabilities.

The `pinoMedicusPlugin` is a plugin that overrides the default error logger with Pino's structured logging and advanced features.

```ts
import { Medicus } from 'medicus';
import { pinoMedicusPlugin } from 'medicus/pino';
import { pino } from 'pino';

const pinoInstance = pino();

// Uses pino as the error logger
const medicus = new Medicus({
  plugins: [pinoMedicusPlugin(pinoInstance)]
});
```

For more details about Pino, check out [Pino documentation](https://getpino.io)
