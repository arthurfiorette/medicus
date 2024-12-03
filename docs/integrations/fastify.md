# Fastify <Badge type="warning" text="Third-Party" />

Fastify is a high-performance web framework for Node.js, designed to offer an exceptional developer experience with minimal overhead and a robust plugin architecture.

You can integrate Medicus with your Fastify application by attaching it to your instance's lifecycle hooks using the `fastifyMedicusPlugin`:

```ts
import fastify from 'fastify';
import { fastifyMedicusPlugin } from 'medicus/fastify.js';

const app = fastify();

// Register Medicus plugin
app.register(fastifyMedicusPlugin, {
  // custom options
  url: '/my-custom-route',
  method: 'PUT'
});

// The health check route is automatically set up
app.listen({ port: 3000 });
```

Once registered, the health check route will be available at `http://localhost:3000/my-custom-route` instead of the default `/health` route.

Additionally, the `app.medicus` object is exposed, allowing you to interact directly with the Medicus instance for custom health check logic.

For more details about Fastify, visit the [Fastify documentation](https://www.fastify.io/).
