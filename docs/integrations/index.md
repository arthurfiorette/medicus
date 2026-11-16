---
title: Health Check Integrations for Node.js Frameworks
description: 'Health check integrations for Fastify, Express, Elysia, Hono, H3, Nitro, Next.js, TanStack Start, Node HTTP, Avvio and Pino.'
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
- **[Elysia](./elysia.md):** Exposes a health check route handler for Elysia applications.
- **[Express](./express.md):** Exposes a health check route handler for Express 4 and 5.
- **[Fastify](./fastify.md):** Attaches `Medicus` to `Fastify` instance lifecycle hooks for streamlined integration.
- **[H3 / Nitro](./h3.md):** Exposes one event handler for H3 apps and Nitro route files.
- **[Hono](./hono.md):** Exposes a ready-to-use health check route handler for Hono applications.
- **[HTTP](./http.md):** Adds a health endpoint to a plain `node:http` server.
- **[Next.js](./nextjs.md):** Exposes health check handlers for the App Router and the Pages Router.
- **[TanStack Start](./tanstack-start.md):** Provides a health check handler for TanStack Start server functions.
