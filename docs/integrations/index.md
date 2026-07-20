---
title: Health Check Integrations for Fastify, Hono, Node.js & More
description: 'Native health check integrations for Node.js frameworks: Fastify plugin, Hono route, plain HTTP endpoint, TanStack Start, Avvio and Pino.'
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
- **[Fastify](./fastify.md):** Attaches `Medicus` to `Fastify` instance lifecycle hooks for streamlined integration.
- **[Hono](./hono.md):** Exposes a ready-to-use health check route handler for Hono applications.
- **[TanStack Start](./tanstack-start.md):** Provides a health check handler for TanStack Start server functions.
