# Node

The `nodeMedicusPlugin` is a plugin that adds a health check for the Node process, with optional system diagnostics. It provides detailed system information, such as CPU usage, memory stats, load averages, and uptime when the `debug` flag is enabled (which is set to `true` by default).

To integrate the `nodeMedicusPlugin` into your Medicus setup, simply import and register it with your Medicus instance:

```ts
import { Medicus } from 'medicus';
import { nodeMedicusPlugin } from 'medicus/node';

const medicus = new Medicus({
  plugins: [nodeMedicusPlugin()]
});
```

## Options 

The `nodeMedicusPlugin` accepts the following options: 

 -  **`checkerName`**: The name of the checker. Defaults to `node`.
 -  **`debug`**: Controls if this plugin should show detailed system information on a debug health request. Defaults to `true`. Users might wanna disable this in case showing this kind of detailed information is not needed on debug requests.

## Output

When the `debug` flag is enabled, the plugin will return detailed system information when the health check is called.

```jsonc
{
  "status": "HEALTHY",
  "debug": {
    "ts": 1637590109385,           // Timestamp of the health check
    "uptime": 12567,               // System uptime in seconds
    "platform": "linux",           // Operating system platform
    "arch": "x64",                 // System architecture
    "cpus": 8,                     // Number of CPUs
    "cpuUsageSystem": 1536000,     // System CPU usage in microseconds
    "cpuUsageUser": 1200000,       // User CPU usage in microseconds
    "memoryTotal": 17179869184,    // Total system memory in bytes
    "memoryFree": 8589934592,      // Free system memory in bytes
    "loadAverage1m": 1.25,         // Load average for the last 1 minute
    "loadAverage5m": 1.35,         // Load average for the last 5 minutes
    "loadAverage15m": 1.22         // Load average for the last 15 minutes
  }
}
```

When the `debug` flag is disabled, the plugin will return just a health status without additional system diagnostics.

```json
{
  "status": "healthy"
}
```
