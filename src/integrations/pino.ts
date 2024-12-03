import type { BaseLogger } from 'pino';
import { definePlugin } from '../plugins';

/**
 * Plugin to add pino logger as the `errorLogger` for `Medicus`.
 */
export const pinoMedicusPlugin = definePlugin<BaseLogger>((pino) => ({
  configure(options) {
    options.errorLogger = (error: any, checkerName) => {
      return pino.error(error, `Health check failed for ${checkerName}`);
    };
  }
}));
