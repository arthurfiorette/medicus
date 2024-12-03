# Error Logger

Medicus provides robust support for handling errors that occur during health checks. Whether an error is thrown in an **automatic background check** or during a **manual check**, you can configure an `errorLogger` function to handle these errors effectively.

The `errorLogger` is invoked with the error and the name of the checker where it occurred, allowing you to centralize and customize error handling for your system.

```ts
import { Medicus } from 'medicus';

const medicus = new Medicus({
  errorLogger: console.error // default implementation
});
```

## Plugins

### Pino

Medicus provides a built-in integration for [Pino](./integrations/pino.md) to help you easily integrate Pino as your error logger.

## Custom Integrations

Need a different error logger or use a custom logging solution? Medicus makes it easy to add your own integration.

Want to share your implementation? [Open a PR](https://github.com/arthurfiorette/medicus/pulls) to contribute it to Medicus!
