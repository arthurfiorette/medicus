# Integrations

`Medicus` offers two types of integrations, each designed to extend its functionality in unique ways.

## Plugins

Plugins are used within `Medicus`'s `plugins` configuration option to enhance its capabilities for specific integrations:

- **[Pino](./pino.md):** Integrates with the `Pino` logger to map error logging effectively.
- **[Node.js](./node.md):** Adds a `Node.js` health checker to monitor event loop lag and ensure runtime stability.
- **[OpenTelemetry](./open-telemetry.md):** Enables `OpenTelemetry` support to trace health checks and capture failure diagnostics.

## Third-Party Integrations

These integrations allow you to seamlessly connect `Medicus` with external libraries and frameworks:

- **[Avvio](./avvio.md):** Hooks `Medicus` into the `Avvio` lifecycle to initiate health checks after the server is ready.
- **[Fastify](./fastify.md):** Attaches `Medicus` to `Fastify` instance lifecycle hooks for streamlined integration.
