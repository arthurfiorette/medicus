# Next.js Integration

The Next.js integration provides a simple way to add health checks to your Next.js application using the Pages Router API routes.

## Installation

First, install Medicus and Next.js types if you haven't already:

```bash
npm install medicus
npm install --save-dev next
```

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

This will create a health check endpoint at `/api/health` that returns:

```json
{
  "status": "healthy",
  "services": {
    "database": {
      "status": "healthy"
    }
  }
}
```

## Query Parameters

The handler supports the following query parameters:

- `?debug=true` - Include debug information in the response
- `?last=true` - Return the last cached health check result (useful with background checks)
- `?simulate=healthy|degraded|unhealthy` - Simulate a specific health status (useful for testing)

### Example with Debug Information

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
  }
});
```

Calling `/api/health?debug=true` will return:

```json
{
  "status": "healthy",
  "services": {
    "database": {
      "status": "healthy",
      "debug": {
        "connections": 10,
        "maxConnections": 100
      }
    }
  }
}
```

## Configuration Options

The `debug` option controls whether to show debug information in the response. It can be:

- **`boolean`** - Enable/disable debug output for all requests
- **`function`** - A function `(req: NextApiRequest) => boolean | Promise<boolean>` that receives the request and returns whether to show debug info

```ts
interface NextApiHealthCheckOptions {
  debug?: boolean | ((req: NextApiRequest) => boolean | Promise<boolean>);
}
```

### Enable Debug by Default

```ts
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

## Real-World Example

Here's a complete example with multiple health checkers:

```ts
// pages/api/health.ts
import { HealthStatus } from 'medicus';
import { createNextApiHealthCheckHandler } from 'medicus/nextjs';
import { checkDatabase } from '@/lib/db';
import { checkRedis } from '@/lib/redis';

export default createNextApiHealthCheckHandler({
  checkers: {
    async database() {
      try {
        await checkDatabase();
        return HealthStatus.HEALTHY;
      } catch (error) {
        return HealthStatus.UNHEALTHY;
      }
    },
    async redis() {
      try {
        const isHealthy = await checkRedis();
        return isHealthy ? HealthStatus.HEALTHY : HealthStatus.DEGRADED;
      } catch (error) {
        return HealthStatus.UNHEALTHY;
      }
    },
    async api() {
      try {
        const response = await fetch('https://api.example.com/health');
        return response.ok ? HealthStatus.HEALTHY : HealthStatus.DEGRADED;
      } catch (error) {
        return HealthStatus.UNHEALTHY;
      }
    }
  }
});
```

## Background Checks

You can configure background health checks directly in the options:

```ts
// pages/api/health.ts
import { HealthStatus } from 'medicus';
import { createNextApiHealthCheckHandler } from 'medicus/nextjs';

export default createNextApiHealthCheckHandler({
  checkers: {
    database: async () => {
      // Expensive check
      await checkDatabase();
      return HealthStatus.HEALTHY;
    }
  },
  // Run checks every 30 seconds in the background
  backgroundCheckInterval: 30000,
  // Run first check immediately on startup
  eagerBackgroundCheck: true
});
```

Now you can call `/api/health?last=true` to get instant responses from the cache.

Alternatively, if you're using a pre-created Medicus instance:

```ts
const medicus = new Medicus({
  checkers: {
    database: () => HealthStatus.HEALTHY
  }
});

// Start background checks manually
medicus.startBackgroundCheck(30000);

export default createNextApiHealthCheckHandler(medicus);
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

## TypeScript Support

The integration is fully typed and works seamlessly with TypeScript:

```ts
import { Medicus, HealthStatus } from 'medicus';
import { createNextApiHealthCheckHandler } from 'medicus/nextjs';

// Type-safe context
interface AppContext {
  config: {
    dbUrl: string;
  };
}

const medicus = new Medicus<AppContext>({
  context: {
    config: {
      dbUrl: process.env.DATABASE_URL!
    }
  },
  checkers: {
    database: (ctx) => {
      // ctx is fully typed as AppContext
      console.log(ctx.config.dbUrl);
      return HealthStatus.HEALTHY;
    }
  }
});

export default createNextApiHealthCheckHandler(medicus);
```
