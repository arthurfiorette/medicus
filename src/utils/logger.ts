import type { MedicusErrorLogger } from '../types';

/**
 * Default error logger that will be used when no custom logger is provided.
 */
export const defaultErrorLogger: MedicusErrorLogger = (error, checkerName) => {
  return console.error(`Health check failed for ${checkerName}`, error);
};
