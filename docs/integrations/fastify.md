# Fastify <Badge type="warning" text="Third-Party"  />

Fastify is a web framework for Node.js that is focused on providing the best developer experience with the least overhead and a powerful plugin architecture.

You can attach Medicus to your Fastify instance lifecycle hooks using the `fastifyMedicusPlugin`.

```ts
import fastify from 'fastify';
import { fastifyMedicusPlugin } from 'medicus/fastify.js';

const app = fastify();

app.register(fastifyMedicusPlugin);

// Health check route is automatically registered
app.listen({ port: 3000 });
```

Later, you can access the health check route at `http://localhost:3000/health`.

`app.medicus` is available to you to interact with the Medicus instance.

To read more about Fastify, check out the [Fastify documentation](https://www.fastify.io/).
