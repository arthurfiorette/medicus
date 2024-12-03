# Plugins

Plugins in `Medicus` serve as the primary mechanism to customize and extend its functionality. They enable integration with third-party services or the addition of new features tailored to your application's requirements.

## Creating Plugins

To create a plugin, define its structure using the `definePlugin` function. A plugin can introduce new health checkers, modify configuration options, or respond to lifecycle events.

```ts
import { definePlugin, HealthStatus } from 'medicus';

export const myPlugin = definePlugin<void>(() => ({
  // Add new health checkers
  checkers: {
    myCheck() {
      return HealthStatus.HEALTHY;
    }
  },

  // Modify default configuration or introduce new options
  configure(options) {
    options.backgroundCheckInterval = 30;
  },

  // Hook into the instance creation lifecycle
  created(medicus) {
    console.log(
      `Medicus instance created with ${medicus.countCheckers()} checkers!`
    );
  }
}));
```

## Customizing Plugin Options

Plugins can be made configurable by defining options in their structure. This allows dynamic behavior based on the options provided during initialization.

```ts
import { definePlugin, HealthStatus } from 'medicus';

export const myPlugin = definePlugin<{ fail: boolean }>((options) => {
  if (options.fail) {
    throw new Error('Plugin failed');
  }

  return {
    checkers: {
      myCheck() {
        return HealthStatus.HEALTHY;
      }
    }
  };
});
```

## Plugin Context

Sometimes, plugins require additional contextual values. You can define a context type using a generic argument for `definePlugin`. This ensures the context is correctly passed and validated.

```ts
// @errors: 2322
import { definePlugin, Medicus, HealthStatus } from 'medicus';

// Define a plugin expecting context of type `{ a: string }`
export const myPlugin = definePlugin<void, { a: string }>(() => ({
  /* Plugin implementation */
}));

// Valid usage: context matches plugin expectations
const valid = new Medicus<{ a: string }>({
  context: { a: 'Arthur' },
  plugins: [myPlugin()]
});

// Invalid usage: context mismatch
const invalid = new Medicus<{ b: string }>({
  context: { b: 'Arthur' },
  plugins: [myPlugin()]
});
```

With plugins, your creativity is the limit. They provide a flexible and powerful way to extend `Medicus` while maintaining clear and organized code.
