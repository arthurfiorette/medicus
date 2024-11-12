<h1>Medicus</h1>

Medicus is a comprehensive, agnostic health check library for Node.js. It provides an easy way to monitor the health of various services and integrates seamlessly with Fastify.

- [Installation](#installation)
- [Usage](#usage)
  - [1. Standalone Mode](#1-standalone-mode)
  - [Options](#options)
  - [2. Fastify Plugin Mode](#2-fastify-plugin-mode)
    - [Customizing Checkers and Debugging](#customizing-checkers-and-debugging)
  - [API](#api)
    - [Medicus Methods](#medicus-methods)
- [Examples](#examples)
  - [Background Health Checks](#background-health-checks)
  - [Error Logging](#error-logging)
- [Fastify Route](#fastify-route)
- [Tests](#tests)
- [License](#license)

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
console.log(result); // { status: 'UNHEALTHY', services: { database: { status: 'HEALTHY' }, cache: { status: 'UNHEALTHY' } } }
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

## Fastify Route

Medicus automatically registers a `/health` route in Fastify, returning the health status of all registered services. Use `?last=true` to get the cached result or `?last=false` to force a new check.

## Tests

Medicus is thoroughly tested, covering all edge cases such as checker registration, background checks, error handling, and integration with Fastify.

## License

Medicus is open-source software licensed under the MIT License.
