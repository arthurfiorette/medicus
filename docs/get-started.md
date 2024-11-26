# Get Started

Implementing health checks and collecting their output is straightforward, but **Medicus** elevates this process to a new level.

Medicus offers more than just simplicity; it delivers an extensive ecosystem of **ready-to-use integrations**, **comprehensive documentation**, and **native compatibility** with popular libraries and frameworks.

By providing pre-built checks, clear guidance for setup, and seamless support for your preferred stack, Medicus makes health monitoring effortless yet highly effective. It enables developers to focus on building their applications, confident that system health is being managed with minimal effort and maximum reliability.

---

## Installation

Install Medicus using your preferred package manager:

::: code-group

```sh [npm]
npm install medicus
```

```sh [pnpm]
pnpm install medicus
```

```sh [yarn]
yarn add medicus
```

:::

---

## Medicus Class

The `Medicus` class is the core of the library. While you’ll often use Medicus through one of its [integrations](./integrations/index.md), it’s helpful to understand its base functionality.

A `Medicus` instance allows you to define and manage health checkers for your application.

```ts
import { Medicus, HealthStatus, type MedicusOption } from 'medicus';

const medicus = new Medicus({
  checkers: {
    postgresDatabase() {
      // Run some checks
      return HealthStatus.HEALTHY;
    }
  }
});

// Add or remove checkers dynamically
medicus.removeChecker('postgresDatabase'); // true
medicus.addChecker({
  redisDatabase() {
    // Run some checks
    return HealthStatus.UNHEALTHY;
  }
});
```

---

## Context

Health checks often require a connection to your application’s state or resources. This is where the `context` feature comes in.

When initializing a `Medicus` instance, you can pass a `context` object that will be provided to all health checkers when they execute.

```ts
import { Medicus, HealthStatus } from 'medicus';

const medicus = new Medicus({
  context: {
    dbConnection: 'postgres://localhost:5432'
  }
});

medicus.addChecker({
  database(context) {
    // Typed context!
    console.log(context.dbConnection);
    return HealthStatus.HEALTHY;
  }
});
```

The `context` ensures that your health checkers have access to the resources and data they need, simplifying setup and ensuring consistency.
