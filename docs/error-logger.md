# Error Logger

Medicus provides robust support for handling errors that occur during health checks. Whether an error is thrown in an **automatic background check** or during a **manual check**, you can configure an `errorLogger` function to handle these errors effectively.

The `errorLogger` is invoked with the error and the name of the checker where it occurred, allowing you to centralize and customize error handling for your system.

```ts
import { Medicus } from 'medicus';

const medicus = new Medicus({
  // Your custom error handling implementation
  errorLogger(error, checkerName) {
    console.log('Service check failed:', checkerName, error);
  }
});
```

## Built-in Error Loggers

Medicus includes two ready-to-use error logger factories for seamless integration with popular logging solutions:

### Pino

If you’re using [Pino](https://getpino.io/) for logging, the `pinoToErrorLogger` function maps errors directly to your Pino instance.

```ts
import { Utils, Medicus } from 'medicus';

// Replace with your actual Pino instance
let myPinoInstance!: any;

const medicus = new Medicus({
  // Maps errors to the Pino logger
  errorLogger: Utils.pinoToErrorLogger(myPinoInstance)
});
```

### Console

For applications without a dedicated logger, you can use the `consoleErrorLogger` function, which logs errors to the console (defaulting to `console.error`).

```ts
import { Utils, Medicus } from 'medicus';

const medicus = new Medicus({
  // Logs errors to the console
  errorLogger: Utils.consoleToErrorLogger()
});
```

## Custom Integrations

Need a different error logger or use a custom logging solution? Medicus makes it easy to add your own integration.

Want to share your implementation? [Open a PR](https://github.com/arthurfiorette/medicus/pulls) to contribute it to Medicus!
