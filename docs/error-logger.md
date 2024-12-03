# Error Logger

Medicus provides robust support for managing errors during health checks. Whether the error occurs in an **automatic background check** or during a **manual check**, you can configure a custom `errorLogger` function to centralize and customize error handling for your system.

## Custom Error Logger

The `errorLogger` is a configurable function that receives the error and the name of the checker where it occurred. This makes it easy to integrate your logging solution and ensure consistent error tracking.

```ts
import { Medicus } from 'medicus';

const medicus = new Medicus({
  // Custom error handling implementation
  errorLogger(error, checkerName) {
    console.log('Health check failed:', checkerName, error);
  }
});
```

## Default Error Logger

If no custom error logger is provided, Medicus uses a default implementation based on `console.error`. This is straightforward and sufficient for development environments but can be replaced with a more robust solution for production.

```ts
import type { MedicusErrorLogger } from 'medicus';

export const defaultErrorLogger: MedicusErrorLogger = (
  error,
  checkerName
) => {
  console.error(`Health check failed for ${checkerName}`, error);
};
```

## Integrations

### Pino

Medicus supports integration with [Pino](./integrations/pino.md), a high-performance JSON logger, allowing you to easily use Pino as your error logger.

## Custom Integrations

Do you need to integrate another logging tool or a custom solution? Medicus is designed to be flexible, letting you add your own error logger with ease.

Have a great implementation you'd like to share? [Contribute to Medicus](https://github.com/arthurfiorette/medicus/pulls) by opening a pull request!
