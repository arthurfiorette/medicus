# Integrations

There are two kinds of integrations in `Medicus`, you can use both to extend its functionality.

## Plugins

Used inside `Medicus`'s `plugins` options to extend its functionality according to that specific integration.

- [Pino](./pino.md): Maps the error logger to `pino`
- [Node.js](./node.md): Adds a `Node.js` health checker to measure the event loop lag
- [Open telemetry](./open-telemetry.md): Adds support for `OpenTelemetry` to trace the health checks and failures

## Third-party integrations

Used in other libraries and frameworks that you can use to attach `Medicus` to them.

- [Avvio](./avvio.md): Integrates `Medicus` with `Avvio` to start the health checks after the server is ready
- [Fastify](./fastify.md): Attaches `Medicus` to your `fastify` instance lifecycle hooks
