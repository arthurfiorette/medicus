# Next.js Integration

The Next.js integration provides a simple way to add health checks to your Next.js application using the Pages Router API routes.

## Installation

First, install Medicus and Next.js types if you haven't already:

```bash
npm install medicus
npm install --save-dev next
```

## Basic Usage

Create a health check API route in your Next.js application:

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
import { Medicus, HealthStatus } from 'medicus';
import { createNextApiHealthCheckHandler } from 'medicus/nextjs';

const medicus = new Medicus({
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

export default createNextApiHealthCheckHandler(medicus);
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

```ts
interface NextApiHealthCheckOptions {
  debug?: boolean; // Include debug info by default
}
```

### Enable Debug by Default

```ts
export default createNextApiHealthCheckHandler(medicus, {
  debug: true
});
```

## Real-World Example

Here's a complete example with multiple health checkers:

```ts
// pages/api/health.ts
import { Medicus, HealthStatus } from 'medicus';
import { createNextApiHealthCheckHandler } from 'medicus/nextjs';
import { checkDatabase } from '@/lib/db';
import { checkRedis } from '@/lib/redis';

const medicus = new Medicus({
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

export default createNextApiHealthCheckHandler(medicus);
```

## Background Checks

You can combine the Next.js handler with background health checks to improve response times:

```ts
// pages/api/health.ts
import { Medicus, HealthStatus } from 'medicus';
import { createNextApiHealthCheckHandler } from 'medicus/nextjs';

const medicus = new Medicus({
  checkers: {
    database: async () => {
      // Expensive check
      await checkDatabase();
      return HealthStatus.HEALTHY;
    }
  }
});

// Run checks every 30 seconds in the background
medicus.startBackgroundCheck(30000);

// Requests can use ?last=true to get cached results instantly
export default createNextApiHealthCheckHandler(medicus);
```

Now you can call `/api/health?last=true` to get instant responses from the cache.

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
