# Next.js <Badge type="warning" text="Third-Party" />

The Next.js integration provides a simple way to add health checks to your Next.js application using the Pages Router API routes.

## Basic Usage

Create a health check API route in your Next.js application. You can pass options directly:

```ts
// pages/api/health.ts
import { HealthStatus } from 'medicus';
import { createNextApiHealthCheckHandler } from 'medicus/nextjs';

export default createNextApiHealthCheckHandler({
  checkers: {
    database: () => HealthStatus.HEALTHY
  }
});
```

Or use a pre-created Medicus instance:

```ts
// pages/api/health.ts
import { Medicus, HealthStatus } from 'medicus';
import { createNextApiHealthCheckHandler } from 'medicus/nextjs';

const medicus = new Medicus({
  checkers: {
    database: () => HealthStatus.HEALTHY
  }
});

export default createNextApiHealthCheckHandler(medicus);
```

## Configuration Options

The `debug` option controls whether to show debug information in the response. It can be:

- **`boolean`** - Enable/disable debug output for all requests
- **`function`** - A function `(req: NextApiRequest) => boolean | Promise<boolean>` that receives the request and returns whether to show debug info

```ts
import type { NextApiRequest } from 'next';

interface NextApiHealthCheckOptions {
  debug?:
    | boolean
    | ((req: NextApiRequest) => boolean | Promise<boolean>);
}
```

### Enable Debug by Default

```ts
import { HealthStatus } from 'medicus';
import { createNextApiHealthCheckHandler } from 'medicus/nextjs';

export default createNextApiHealthCheckHandler({
  checkers: {
    database: () => HealthStatus.HEALTHY
  },
  debug: true
});
```

### Conditional Debug Based on Authentication

You can use a function to conditionally show debug information based on request properties like authentication:

```ts
// pages/api/health.ts
import { HealthStatus } from 'medicus';
import { createNextApiHealthCheckHandler } from 'medicus/nextjs';

export default createNextApiHealthCheckHandler({
  checkers: {
    database: () => ({
      status: HealthStatus.HEALTHY,
      debug: {
        connections: 10,
        maxConnections: 100
      }
    })
  },
  debug: (req) => {
    // Only show debug info if authorized
    return req.headers.authorization === 'Bearer secret-token';
  }
});
```

This is useful for protecting sensitive debug information in production while still allowing authorized users to access it.

You can also use async functions:

```ts
import { HealthStatus } from 'medicus';
import { createNextApiHealthCheckHandler } from 'medicus/nextjs';

export default createNextApiHealthCheckHandler({
  checkers: {
    database: () => HealthStatus.HEALTHY
  },
  debug: async (req) => {
    // Async auth check
    const user = await validateToken(req.headers.authorization);
    return user?.role === 'admin';
  }
});
```

## Status Codes

The handler returns appropriate HTTP status codes:

- `200 OK` - Service is healthy or degraded
- `503 Service Unavailable` - Service is unhealthy

## Next.js App Router

:::warning
Currently, this integration is designed for the **Pages Router**. Support for the App Router (Route Handlers) will be added in a future release.
:::

If you need to use Medicus with the App Router today, you can use the generic HTTP integration:

```ts
// app/api/health/route.ts
import { Medicus, HealthStatus } from 'medicus';
import { NextResponse } from 'next/server';

const medicus = new Medicus({
  checkers: {
    database: () => HealthStatus.HEALTHY
  }
});

export async function GET() {
  const result = await medicus.performCheck();
  const status = result.status === 'unhealthy' ? 503 : 200;
  return NextResponse.json(result, { status });
}
```
