import type { Medicus } from './medicus';

export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy'
}

export interface DetailedHealthCheck {
  /** The status of the health check */
  status: HealthStatus;

  /** A list of key-value pairs with additional information about the health check to be shown in the debug output */
  debug?: Record<string, number | boolean | string>;
}

export interface HealthCheckResult {
  /** The status of the health check */
  status: HealthStatus;

  /** A per service breakdown of the health check results */
  services: Record<string, DetailedHealthCheck>;
}

/** A health check function that can be used to check if a part of the system is healthy */
export type HealthChecker<C> = (
  this: void,
  ctx: C
) =>
  | void
  | HealthStatus
  | DetailedHealthCheck
  | Promise<void>
  | Promise<HealthStatus>
  | Promise<DetailedHealthCheck>;

/**
 * Function signature for the error logger
 */
export type MedicusErrorLogger = (error: unknown, checkerName: string) => void;

export interface MedicusOption<Ctx> {
  /** List of checkers to automatically add to the medicus instance */
  checkers?: Record<string, HealthChecker<Ctx>>;

  /** Context for the checkers to be executed in */
  context?: Ctx;

  /**
   * If provided, this function will be called whenever an error occurs during the execution of a health check
   *
   * If `onBackgroundCheck` is provided and throws an error, this function will be called and `onBackgroundCheck` will
   * be the second parameter
   */
  errorLogger?: MedicusErrorLogger;

  /**
   * By default {@linkcode Medicus.performCheck} needs to be called manually to perform a health check.
   *
   * If set to true, the health check will be performed automatically in the background at the specified interval.
   *
   * @default null
   */
  backgroundCheckInterval?: number;

  /**
   * Called for every generated background check result.
   *
   * Some non-exposed systems, instead of providing as a API to be called by third-party systems, they must manually
   * push the result into another API in form of a cron-job or heartbeat mechanism.
   */
  onBackgroundCheck?: (result: HealthCheckResult) => void | Promise<void>;
}
