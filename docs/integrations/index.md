---
title: Health Check Integrations for Node.js Frameworks
description: 'Health check integrations for Fastify, Express, Elysia, Hono, H3, Nitro, TanStack Start, Node HTTP, Avvio and Pino.'
---

# Integrations

`Medicus` offers two types of integrations, each designed to extend its functionality in unique ways.

## Plugins

Plugins are used within `Medicus`'s `plugins` configuration option to enhance its capabilities for specific integrations:

- **[Pino](./pino.md):** Integrates with the `Pino` logger to map error logging effectively.
- **[Node.js](./node.md):** Adds a `Node.js` process health checker reporting CPU usage, memory, load average and uptime diagnostics.

## Third-Party Integrations

These integrations allow you to seamlessly connect `Medicus` with external libraries and frameworks:

- **[Avvio](./avvio.md):** Hooks `Medicus` into the `Avvio` lifecycle to initiate health checks after the server is ready.
- **[Elysia](./elysia.md):** Provides a route handler that can be mounted at any application-defined path.
- **[Express](./express.md):** Provides an Express 4 and 5 route handler with request context.
- **[Fastify](./fastify.md):** Attaches `Medicus` to `Fastify` instance lifecycle hooks for streamlined integration.
- **[H3 / Nitro](./h3.md):** Exposes one event handler for H3 applications and Nitro filesystem routes.
- **[Hono](./hono.md):** Exposes a ready-to-use health check route handler for Hono applications.
- **[HTTP](./http.md):** Adds a health endpoint to a plain `node:http` server.
- **[TanStack Start](./tanstack-start.md):** Provides a health check handler for TanStack Start server functions.
