import os from 'node:os';
import { type HealthChecker, HealthStatus } from '../types';

export const NodeCheckers = {
  /**
   * A simple nodejs health checker which returns the current status of the node process
   */
  process() {
    const cpuUsage = process.cpuUsage();
    const loadAverage = os.loadavg();

    return {
      status: HealthStatus.HEALTHY,
      debug: {
        ts: Date.now(),
        uptime: os.uptime(),
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        cpuUsageSystem: cpuUsage.system,
        cpuUsageUser: cpuUsage.user,
        memoryTotal: os.totalmem(),
        memoryFree: os.freemem(),
        loadAverage1m: loadAverage[0]!,
        loadAverage5m: loadAverage[1]!,
        loadAverage15m: loadAverage[2]!
      }
    };
  }
} as const satisfies Record<string, HealthChecker<void>>;
