# Avvio <Badge type="warning" text="Third-Party" />

Avvio is a highly performant application booting and plugin system, designed to manage the loading and bootstrapping of asynchronous components in Node applications. It's the core plugin system used by Fastify and other frameworks, providing a reliable and type-safe way to handle plugin registration and dependencies.

The `avvioMedicusPlugin` integrates Medicus health checking capabilities into your Avvio-based application, allowing you to monitor the health of your services while taking advantage of Avvio's plugin system. It automatically registers a Medicus instance within your application context and handles proper cleanup on application shutdown.

## Options

The `avvioMedicusPlugin` accepts the following options:

- **`plugins`**: Array of Medicus plugins to register (e.g., [`nodeMedicusPlugin`](/integrations/node), [`pinoMedicusPlugin`](/integrations/pino)).
- **`checkers`**: Object containing health check functions for different services.
- **`backgroundCheckInterval`**: Interval in milliseconds for background health checks (set to a number greater than 0 to enable, defaults to undefined).
- **`onBackgroundCheck`**: Callback function executed after each background health check.

## Example of usage

The plugin enables automated health monitoring through background checks and heartbeat reporting. This feature is crucial for maintaining service reliability by continuously verifying your system's health and reporting its status to external systems.

Here's an example of heartbeat reporting:

```ts
import { HealthStatus } from 'medicus'
import { avvioMedicusPlugin } from 'medicus/avvio.js'
import { nodeMedicusPlugin } from 'medicus/node.js'
import { pinoMedicusPlugin } from 'medicus/pino.js'

avvioMedicusPlugin({
  checkers: {
    database() {
       return HealthStatus.HEALTHY
    }
  },
  backgroundCheckInterval: 30000, // 30 seconds
  async onBackgroundCheck(checkResult) {
    if (checkResult.status !== HealthStatus.HEALTHY) {
      console.error('Background check failed', checkResult)
      return
    }

    try {
      // Sending heartbeat to a external system
      await fetch(process.env.HEARTBEAT_URL as string) 
    } catch (error) {
      console.error('Failed to send heartbeat', error)
    }
  }
});
```