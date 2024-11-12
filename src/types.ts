import type { Medicus } from './medicus';

export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy'
}

export interface DetailedHealthCheck {
  /**
   * The status of the health check
   */
  status: HealthStatus;

  /**
   * A list of key-value pairs with additional information about the health check
   * to be shown in the debug output
   */
  debug?: Record<string, number | boolean | string>;
}

export interface HealthCheckResult {
  /**
   * The status of the health check
   */
  status: HealthStatus;

  /**
   * A per service breakdown of the health check results
   */
  services: Record<string, DetailedHealthCheck>;
}

/**
 * A health check function that can be used to check if a part of the system is healthy
 */
export interface HealthChecker<C> {
  (
    this: void,
    ctx: C
  ):
    | void
    | HealthStatus
    | DetailedHealthCheck
    | Promise<void>
    | Promise<HealthStatus>
    | Promise<DetailedHealthCheck>;

  /** The (sub)service name this checks for */
  name: string;
}

export interface MedicusOption<C> {
  /**
   * List of checkers to automatically add to the medicus instance
   */
  checkers?: Record<string, HealthChecker<C>>;

  /**
   * Context for the checkers to be executed in
   */
  context?: C;

  /**
   * If provided, this function will be called whenever an error occurs during the execution of a health check
   */
  errorLogger?: (error: unknown, checkerName: string) => void;

  /**
   * By default {@linkcode Medicus.performCheck} needs to be called manually to perform a health check.
   *
   * If set to true, the health check will be performed automatically in the background at the specified interval.
   *
   * @default null
   */
  backgroundCheckInterval?: number;

  /**
   * If set to true, {@linkcode Medicus.closeBackgroundCheck} should be manually called to stop the background check.
   *
   * @default false
   */
  manualClearBackgroundCheck?: boolean;
}
