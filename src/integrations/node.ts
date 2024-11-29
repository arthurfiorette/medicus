import os from 'node:os';
import { definePlugin } from '../plugins';
import { HealthStatus } from '../types';

export interface NodePluginOptions {
  /**
   * The name of the checker
   *
   * @default 'node'
   */
  checkerName?: string;

  /**
   * If true, the plugin will return some basic information about the  system
   * when the checker is called with the debug flag
   *
   * @default true
   */
  debug?: boolean;
}

/**
 * A simple `MedicusPlugin` that adds a checker to check the health of the nodejs process
 * and returns some basic information about the system
 */
export const nodeMedicusPlugin = definePlugin<NodePluginOptions | undefined>(
  ({ checkerName = 'node', debug = true } = {}) => ({
    checkers: {
      [checkerName]: !debug
        ? () => ({ status: HealthStatus.HEALTHY })
        : () => {
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
    }
  })
);
