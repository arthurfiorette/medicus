import console from 'node:console';
import type { MedicusErrorLogger } from '../types';

// Simple type mapper without needing to import pino library
type BasePinoLogger = {
  error: {
    <T extends object>(obj: T, msg?: string, ...args: any[]): void;
    (obj: unknown, msg?: string, ...args: any[]): void;
    (msg: string, ...args: any[]): void;
  };
};

/**
 * Factory to create a MedicusErrorLogger from a pino logger
 */
export function pinoToErrorLogger(logger: BasePinoLogger): MedicusErrorLogger {
  return (error, checkerName) => {
    return logger.error(error, `Health check failed for ${checkerName}`);
  };
}

/**
 * Simple factory to create a MedicusErrorLogger from a `console.error`-like function
 */
export function consoleToErrorLogger(logger: Console['error'] = console.error): MedicusErrorLogger {
  return (error, checkerName) => {
    return logger(`Health check failed for ${checkerName}`, error);
  };
}
