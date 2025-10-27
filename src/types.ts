import type { Medicus } from './medicus';

/** @internal */
export const kMedicusPlugin = Symbol.for('medicus.plugin');

/**
 * A enum representing the status of a health check, can be either `HEALTHY`, `DEGRADED`
 * or `UNHEALTHY`
 */
export enum HealthStatus {
  /** Service is healthy, no problems detected */
  HEALTHY = 'healthy',

  /** Service is still able to process requests, but there are some problems detected */
  DEGRADED = 'degraded',

  /** Service is having problems and might not be able to process any request at all */
  UNHEALTHY = 'unhealthy'
}

export interface DetailedHealthCheck {
  /** The status of the health check */
  status: HealthStatus;

  /**
   * A list of key-value pairs with additional information about the health check to be
   * shown in the debug output
   */
  debug?: Record<string, number | boolean | string>;
}

/**
 * A listener function that will be called whenever a background check is performed
 * and a new result is available
 */
export type BackgroundCheckListener = (
  this: void,
  result: HealthCheckResult
) => void | Promise<void>;

export interface HealthCheckResult {
  /** The status of the health check */
  status: HealthStatus;

  /** A per service breakdown of the health check results */
  services: Record<string, DetailedHealthCheck>;
}

/**
 * A health check function that can be used to check if a part of the system is healthy
 *
 * @param ctx - The context object passed to all checkers
 * @param signal - An AbortSignal that will be aborted when the checker exceeds the configured timeout.
 *                 Use this signal to gracefully cancel long-running operations.
 *
 * @returns One of the following:
 * - `void` - Indicates healthy status
 * - `HealthStatus` - Explicit health status (HEALTHY, DEGRADED, or UNHEALTHY)
 * - `DetailedHealthCheck` - Health status with additional debug information
 * - A Promise resolving to any of the above
 */
export type HealthChecker<Ctx = void> = (
  this: void,
  ctx: Ctx,
  signal: AbortSignal
) =>
  | void
  | HealthStatus
  | DetailedHealthCheck
  | Promise<void>
  | Promise<HealthStatus>
  | Promise<DetailedHealthCheck>;

/** Function signature for the error logger */
export type MedicusErrorLogger = (error: unknown, checkerName: string) => void;

/** Function signature for the unhealthy logger. `details === this.lastCheck` */
export type MedicusUnhealthyLogger = (details: HealthCheckResult) => void;

export type HealthCheckerMap<Ctx> = {
  /**
   * A checker function that will be executed on every health check request to determine
   * a part of the system's health
   */
  [name: string]: HealthChecker<Ctx>;
};

/**
 * A plugin that can be used to extend the functionality of the medicus instance
 */
export interface MedicusPlugin<Ctx = void> {
  /** List of checkers to automatically add to the medicus instance */
  checkers?: HealthCheckerMap<Ctx>;

  /**
   * Called to resolve the final {@linkcode BaseMedicusOption} object
   */
  configure?(options: BaseMedicusOption<Ctx>): void;

  /**
   * Called when the medicus instance is created
   */
  created?(medicus: Medicus<Ctx>): void;
}

/**
 * A factory function that creates a {@linkcode MedicusPlugin} object
 * to be used by the medicus constructor
 */
export type MedicusPluginFactory<O, BaseCtx = void> = <Ctx extends BaseCtx>(
  options: O
) => MedicusPlugin<Ctx>;

/**
 * This interface is the one used by `Medicus` constructor
 */
export interface MedicusOption<Ctx = void> extends BaseMedicusOption<Ctx> {
  /**
   * A list of plugins to be used by the medicus instance
   */
  plugins?: MedicusPlugin<Ctx>[];
}

export interface BaseMedicusOption<Ctx = void> {
  /** List of checkers to automatically add to the medicus instance */
  checkers?: HealthCheckerMap<Ctx>;

  /** Context for the checkers to be executed in */
  context?: Ctx;

  /**
   * If provided, this function will be called whenever an error occurs during the
   * execution of a health check
   *
   * If `onBackgroundCheck` is provided and throws an error, this function will be called
   * with `onBackgroundCheck` as the `checkerName`
   */
  errorLogger?: MedicusErrorLogger;

  /**
   * The unhealthy logger function that will be called whenever an unhealthy status is detected.
   */
  unhealthyLogger?: MedicusUnhealthyLogger;

  /**
   * By default {@linkcode Medicus.performCheck} needs to be called manually to perform a
   * health check.
   *
   * If set to a number greater than 0, the health check will be performed automatically in the
   * background at the specified interval.
   *
   * @default undefined (disabled)
   */
  backgroundCheckInterval?: number;

  /**
   * Controls whether a health check runs immediately upon initialization.
   *
   * When true, a health check is executed right away when the background check
   * is started, without waiting for the first interval to elapse.
   *
   * This is particularly useful during application startup/restart scenarios where waiting
   * for the first interval could cause monitoring services to incorrectly mark your service
   * as "down" temporarily, which may trigger false alerts or impact availability metrics
   *
   * When false, the first check will only happen after the specified interval has passed.
   *
   * @default true
   */
  eagerBackgroundCheck?: boolean;

  /**
   * The maximum time in milliseconds a checker is allowed to run before being considered
   * unhealthy.
   *
   * A `TimeoutUnhealthyCheck` will be used for the result of the checker if it times out.
   *
   * @default 5000
   */
  checkerTimeoutMs?: number;

  /**
   * Called for every generated background check result.
   *
   * Some non-exposed systems, instead of providing as a API to be called by third-party
   * systems, they must manually push the result into another API in form of a cron-job or
   * heartbeat mechanism.
   */
  onBackgroundCheck?: BackgroundCheckListener;
}
