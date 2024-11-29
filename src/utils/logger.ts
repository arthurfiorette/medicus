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

// TODO: Remover esse cara em favor do plugin
export function pinoToErrorLogger(logger: BasePinoLogger): MedicusErrorLogger {
  return (error, checkerName) => {
    return logger.error(error, `Health check failed for ${checkerName}`);
  };
}

// TODO: Colocar esse logger como padrão.
export function consoleToErrorLogger(logger: Console['error'] = console.error): MedicusErrorLogger {
  return (error, checkerName) => {
    return logger(`Health check failed for ${checkerName}`, error);
  };
}
