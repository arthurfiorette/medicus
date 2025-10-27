import type { BaseLogger } from 'pino';
import { definePlugin } from '../plugins';

/**
 * Plugin to add pino logger as the `errorLogger` for `Medicus`.
 */
export const pinoMedicusPlugin = definePlugin<BaseLogger>((pino) => ({
  configure(options) {
    options.errorLogger = function pinoErrorLogger(error: any, checkerName) {
      return pino.error(error, `Health check failed for ${checkerName}`);
    };

    options.unhealthyLogger = function pinoUnhealthyLogger(details) {
      return pino.fatal(details.services, `System is ${details.status}`);
    };
  }
}));
