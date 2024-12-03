# Pino

Pino is a high-performance JSON logger that works well in development and production environments and provides enhanced logging capabilities.

The `pinoMedicusPlugin` function is a custom plugin that allows you to replace the default console.error with Pino’s structured logging and advanced features, to use it, simply pass your Pino instance to the plugin.

```ts
import { pino } from 'pino';
import { Medicus } from 'medicus';
import { pinoMedicusPlugin } from 'medicus/pino';

const pinoInstance = pino();

const medicus = new Medicus({
  // Maps errors to the pino.error function
  errorLogger: pinoMedicusPlugin(pinoInstance)
});
```

For more details about Pino, check out [Pino documentation](https://github.com/pinojs/pino?tab=readme-ov-file#documentation)