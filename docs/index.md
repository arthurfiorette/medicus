---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: 'Medicus'
  text: 'Flexible and agnostic health checks.'
  tagline: Ensure the post-deployment health of your services.
  image:
    src: /medicus.svg
    alt: Dna svg with yellow colors
    title: Medicus logo
---

## Installation

```bash
npm install medicus
```

## Usage

Medicus can be used in two modes:

1. **Standalone Mode** for Node.js applications.
2. **Fastify Plugin Mode** for Fastify-based applications.

### 1. Standalone Mode

To use Medicus in a standalone manner, you can import and instantiate the `Medicus` class:

```javascript
import { Medicus, HealthStatus } from 'medicus';

const medicus = new Medicus();

// Add health checkers
medicus.addChecker({
  database() {
    // Custom health logic
    return HealthStatus.HEALTHY;
  },
  cache() {
    // Simulate an unhealthy status
    return HealthStatus.UNHEALTHY;
  }
});

// Perform a health check
const result = await medicus.performCheck();
// {
//   status: 'UNHEALTHY',
//   services: {
//     database: { status: 'HEALTHY' },
//     cache: { status: 'UNHEALTHY' }
//   }
// }
```

### Options

The `Medicus` constructor accepts an options object:

```typescript
interface MedicusOption<C> {
  checkers?: Record<string, HealthChecker<C>>; // Initial health checkers
  context?: C; // Execution context for checkers
  errorLogger?: (error: unknown, checkerName: string) => void; // Custom error logging
  backgroundCheckInterval?: number; // Interval for automatic background checks
  manualClearBackgroundCheck?: boolean; // Manual control over background checks
}
```

### 2. Fastify Plugin Mode

Medicus can also be used as a Fastify plugin:

```javascript
import fastify from 'fastify';
import { fastifyPlugin } from 'medicus/fastify';

const app = fastify();

app.register(fastifyPlugin);

// Health check route is automatically registered
app.listen({ port: 3000 });
```

#### Customizing Checkers and Debugging

```javascript
await app.register(fastifyPlugin, {
  checkers: {
    database() {
      return { status: 'HEALTHY', debug: { latency: '10ms' } };
    }
  },
  debug(req) {
    return req.headers['x-debug'] === 'true';
  }
});
```

### API

#### Medicus Methods

- **`addChecker(checker: HealthChecker): void`**  
  Adds a new health checker. Throws if a checker with the same name exists.

- **`removeChecker(nameOrRef: string | HealthChecker): void`**  
  Removes a checker by its name or function reference.

- **`performCheck(): Promise<HealthCheckResult>`**  
  Executes all health checks and returns a detailed result.

- **`getLastCheck(): HealthCheckResult | null`**  
  Retrieves the result of the last performed check, or `null` if none was executed.

- **`closeBackgroundCheck(): void`**  
  Stops the background health check, if running.

---

## Examples

### Background Health Checks

```javascript
const medicus = new Medicus({
  backgroundCheckInterval: 10000, // Perform checks every 10 seconds
  manualClearBackgroundCheck: true // Stop manually when needed
});

// Start performing checks in the background
await setTimeout(20000); // Wait and check results
```

### Error Logging

```javascript
const medicus = new Medicus({
  errorLogger: (error, checkerName) => {
    console.error(`Error in checker "${checkerName}":`, error);
  }
});
```

### HealthChecker Return Types

A `HealthChecker` function is used to determine the health status of a specific service or subsystem within your application. The function signature allows for multiple return types to accommodate various levels of detail and asynchronous operations.

#### 1. `void`

The simplest return type indicates that the service is considered **healthy**. For example:

```typescript
function simpleChecker(): void {
  // No return means the service is healthy
}
```

#### 2. `HealthStatus`

The `HealthStatus` enum provides three possible values to represent the general health status:

- **`HealthStatus.HEALTHY`**: Indicates the service is fully operational.
- **`HealthStatus.DEGRADED`**: Indicates the service is operational but with reduced performance or limited functionality.
- **`HealthStatus.UNHEALTHY`**: Indicates the service is non-operational or has severe issues.

Example:

```typescript
function enumChecker(): HealthStatus {
  return HealthStatus.HEALTHY; // The service is healthy
}
```

#### 3. `DetailedHealthCheck`

The `DetailedHealthCheck` interface provides a more comprehensive status report, including optional debug information:

```typescript
interface DetailedHealthCheck {
  status: HealthStatus; // The health status of the service
  debug?: Record<string, number | boolean | string>; // Optional key-value debug details
}
```

Example:

```typescript
function detailedChecker(): DetailedHealthCheck {
  return {
    status: HealthStatus.DEGRADED,
    debug: {
      responseTime: '500ms' // Additional debug information
    }
  };
}
```

#### 4. `Promise<void>`

A `HealthChecker` can also return a `Promise<void>`, allowing for asynchronous checks. This indicates the service is healthy:

```typescript
async function asyncVoidChecker(): Promise<void> {
  await someAsyncOperation();
  // No return means the service is healthy
}
```

#### 5. `Promise<HealthStatus>`

You can return a `Promise<HealthStatus>` for async checks that need to return a basic health status:

```typescript
async function asyncEnumChecker(): Promise<HealthStatus> {
  const status = await fetchServiceStatus();
  return status ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY;
}
```

#### 6. `Promise<DetailedHealthCheck>`

For asynchronous checks that require detailed reporting, you can return a `Promise<DetailedHealthCheck>`:

```typescript
async function asyncDetailedChecker(): Promise<DetailedHealthCheck> {
  const latency = await measureLatency();
  return {
    status:
      latency < 1000 ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
    debug: {
      latency: `${latency}ms`
    }
  };
}
```

When a `HealthChecker` returns a `Promise` that rejects, Medicus interprets this as an **unhealthy** status. Rejected promises are treated as errors, and Medicus will handle them according to the configuration provided, such as logging the error or adding debug information to the health check result.

#### Handling Promise Rejections

1. **Uncaught Error or Explicit `throw`**

   If an error occurs in the `HealthChecker` or you explicitly throw an error, Medicus will mark the service as **unhealthy** and include the error information in the result.

   Example:

   ```typescript
   async function rejectingChecker(): Promise<void> {
     // An error occurs
     throw new Error('Service is down');
   }
   ```

   Medicus will capture the error and structure the health check result like this:

   ```typescript
   {
     status: HealthStatus.UNHEALTHY,
     services: {
       rejectingChecker: {
         status: HealthStatus.UNHEALTHY,
         debug: { error: [Error object] } // Error information
       }
     }
   }
   ```

#### Using `errorLogger`

To handle errors more specifically, you can provide an `errorLogger` function in the `MedicusOption`:

```typescript
const medicus = new Medicus({
  errorLogger: (error, checkerName) => {
    console.error(`Error in checker '${checkerName}':`, error);
  }
});
```

This `errorLogger` function is called whenever a `HealthChecker` throws an error or rejects a promise. It allows you to log or process errors in a custom way.

## `setTimeout` vs `setInterval`

Under the hood the `medicus` uses the `setTimeout` method to perform its pooled background checks. The choice is based on the fact that we do not want to add additional pressure to the system.

In fact, it is known that `setInterval` will call repeatedly at the scheduled time regardless of whether the previous call ended or not, and if the server is already under load, this will likely increase the problem, because those `setInterval` calls will start piling up. `setTimeout`, on the other hand, is called only once and does not cause the mentioned problem.

One note to consider is that because the two methods are not identical, the timer function is not guaranteed to run at exactly the same rate when the system is under pressure or running a long-running process.

## Fastify Route

Medicus automatically registers a `/health` route in Fastify, returning the health status of all registered services. Use `?last=true` to get the cached result or `?last=false` to force a new check.

## Tests

Medicus is thoroughly tested, covering all edge cases such as checker registration, background checks, error handling, and integration with Fastify.

## License

Medicus is open-source software licensed under the MIT License.
