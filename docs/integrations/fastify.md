---
title: Fastify Health Check Plugin
description: 'Add a /health route to Fastify with the Medicus health check plugin: automatic route registration, lifecycle hooks, typed checkers and background checks.'
---

# Fastify <Badge type="warning" text="Third-Party" />

Fastify is a high-performance web framework for Node.js, designed to offer an exceptional developer experience with minimal overhead and a robust plugin architecture.

You can integrate Medicus with your Fastify application by attaching it to your instance's lifecycle hooks using the `fastifyMedicusPlugin`:

```ts
import fastify from 'fastify';
import { fastifyMedicusPlugin } from 'medicus/fastify';
import { nodeMedicusPlugin } from 'medicus/node';

const app = fastify();

// Register Medicus plugin
app.register(fastifyMedicusPlugin, {
  plugins: [nodeMedicusPlugin()]
});

// The health check route is automatically set up
app.listen({ port: 3000 });
```

Once registered, the health check route will be available at `http://localhost:3000/health`.

Additionally, the `app.medicus` object is exposed, allowing you to interact directly with the Medicus instance for custom health check logic.

## Route Options

The `route` option accepts any Fastify route configuration (minus the handler), letting you change the URL, tweak its log level or, when using `@fastify/swagger`, hide it from your OpenAPI schema with `schema: { hide: true }`:

```ts
import fastify from 'fastify';
import { fastifyMedicusPlugin } from 'medicus/fastify';

const app = fastify();

app.register(fastifyMedicusPlugin, {
  route: {
    url: '/-/health',
    logLevel: 'silent'
  }
});
```

Setting `route: false` disables the route entirely while keeping checkers and [background checks](../background-checks.md) running. This is useful for workers that use Fastify as a plugin container without ever calling `listen()`, as shown in the [background workers guide](../guides/background-workers.md).

For more details about Fastify, visit the [Fastify documentation](https://www.fastify.io/).
