# Background Checks

In some cases, you might not want to manually trigger checks with every `performCheck` call. Instead, you may prefer to run checks on a consistent schedule. This is where **background checks** come into play.

## Setting Up Background Checks

You can configure Medicus to automatically run checks at a specified interval. By setting the `backgroundCheckInterval` option, you can ensure a consistent schedule for performing health checks without needing to call `performCheck` manually.

```ts
import { Medicus } from 'medicus';

const medicus = new Medicus({
  // Automatically calls performCheck every 60 seconds
  backgroundCheckInterval: 60_000
});
```

After setting up the background check interval, you can retrieve the result of the last performed check using `getLastCheck()`. If the check has never been run, it will return `null`.

```ts
const check = medicus.getLastCheck(true);

// Prints `null` if the check has never been run
// or the details of the last check
console.log(check);
```

With background checks enabled, Medicus will automatically run health checks on a consistent interval, but you can still manually trigger a check whenever necessary using `performCheck()`.

## Immediate Execution with `eagerBackgroundCheck`

When you enable background checks, you can control whether an initial health check runs immediately upon initialization or if Medicus should wait for the first interval to elapse. This behavior is controlled by the eagerBackgroundCheck option, which defaults to true.

This is especially useful to avoid unintentionally flagging containers with downtime when during deployment of new versions, since it would restart the timeout once the container starts back up again, delaying the first health report.

```ts
import { Medicus } from 'medicus';

const medicus = new Medicus({
  backgroundCheckInterval: 60_000,
  // Controls whether a health check runs immediately
  eagerBackgroundCheck: false
});
```

## Listening for Background Checks

You can also set up an event listener to monitor when a background check is performed. The listener can be either `sync` or `async` and will be triggered every time a check is completed.

```ts
import { Medicus } from 'medicus';

const medicus = new Medicus({
  backgroundCheckInterval: 60_000,
  onBackgroundCheck(check) {
    console.log('Background check performed', check);
  }
});
```

The above example will log the check object every time a background check is performed, i.e., every 60 seconds.

If an error is thrown inside the event listener, it will be captured and sent to the [`errorLogger`](./logger.md#error-logger), if one has been configured.

## `setTimeout` vs `setInterval`

<!-- Yes, I copied the text from https://github.com/fastify/under-pressure/tree/c069a3b58d835326e73de3c6f582803bd7d2402e#settimeout-vs-setinterval  -->

Under the hood the `medicus` uses the `setTimeout` method to perform its pooled background checks. The choice is based on the fact that we do not want to add additional pressure to the system.

In fact, it is known that `setInterval` will call repeatedly at the scheduled time regardless of whether the previous call ended or not, and if the server is already under load, this will likely increase the problem, because those `setInterval` calls will start piling up. `setTimeout`, on the other hand, is called only once and does not cause the mentioned problem.

One note to consider is that because the two methods are not identical, the timer function is not guaranteed to run at exactly the same rate when the system is under pressure or running a long-running process.
