import {
  type BackgroundCheckListener,
  type DetailedHealthCheck,
  type HealthCheckResult,
  type HealthChecker,
  type HealthCheckerMap,
  HealthStatus,
  type MedicusErrorLogger,
  type MedicusOption
} from './types';
import { defaultErrorLogger } from './utils/logger';

/**
 * **Medicus**
 *
 * A flexible and agnostic health check library for Node.js.
 *
 * @see https://medicus.js.org
 * @see https://github.com/arthurfiorette/medicus
 *
 * @example
 *
 * import { Medicus, HealthStatus } from 'medicus';
 *
 * const medicus = new Medicus();
 *
 * // Add health checkers
 * medicus.addChecker({
 *   database() {
 *     // Custom health logic
 *     return HealthStatus.HEALTHY;
 *   },
 *   cache() {
 *     // Simulate an unhealthy status
 *     return HealthStatus.UNHEALTHY;
 *   }
 * });
 *
 * // Perform a health check
 * const result = await medicus.performCheck(true);
 * // {
 * //   status: 'UNHEALTHY',
 * //   services: {
 * //     database: { status: 'HEALTHY' },
 * //     cache: { status: 'UNHEALTHY' }
 * //   }
 * // }
 */
export class Medicus<Ctx = void> {
  /** The interval id of the background check if it's running */
  protected backgroundCheckTimer: NodeJS.Timeout | undefined;

  /**
   * A map of all the checkers that will be executed when the health check is run with the
   * key being the name of the checker
   */
  protected readonly checkers: Map<string, HealthChecker<Ctx>> = new Map();

  /** The context that will be passed to all the checkers when they get executed> This value can can be changed at any time. */
  public context!: Ctx;

  /**
   * The error logger function that will be called whenever an error occurs during the
   * execution of a health check> This value can can be changed at any time.
   */
  public errorLogger: MedicusErrorLogger | undefined;

  /**
   * The last health check result, this is updated every time a health check is run and
   * can be accessed with `getLastCheck`> This value can can be changed at any time.
   */
  public lastCheck: HealthCheckResult | undefined;

  /** The background check defined by the constructor.> This value can can be changed at any time. */
  public readonly onBackgroundCheck: BackgroundCheckListener | undefined;

  constructor(options: MedicusOption<Ctx> = {}) {
    // Configure the instance with the provided options
    if (options.plugins) {
      for (const plugin of options.plugins) {
        if (plugin.configure) {
          plugin.configure(options);
        }
      }
    }

    if (options.context) {
      this.context = options.context;
    }

    this.errorLogger = options.errorLogger || defaultErrorLogger;

    if (options.onBackgroundCheck) {
      this.onBackgroundCheck = options.onBackgroundCheck;
    }

    // adds before userland checkers
    if (options.plugins) {
      for (const plugin of options.plugins) {
        if (plugin.checkers) {
          this.addChecker(plugin.checkers);
        }
      }
    }

    if (options.checkers) {
      this.addChecker(options.checkers);
    }

    if (options.backgroundCheckInterval) {
      this.startBackgroundCheck(options.backgroundCheckInterval);
    }

    // post hook once everything is set up
    if (options.plugins) {
      for (const plugin of options.plugins) {
        if (plugin.created) {
          plugin.created(this);
        }
      }
    }
  }

  /** Adds a new checker to be executed when the health check is run */
  addChecker(checkers: HealthCheckerMap<Ctx>): void {
    for (const [name, value] of Object.entries(checkers)) {
      if (this.checkers.has(name)) {
        throw new Error(`A checker with the name "${name}" is already registered`);
      }

      this.checkers.set(name, value);
    }
  }

  /** Returns an read-only iterator of all the checkers */
  listCheckers(): MapIterator<HealthChecker<Ctx>> {
    return this.checkers.values();
  }

  /** Returns an read-only iterator of all the checkers */
  countCheckers(): number {
    return this.checkers.size;
  }

  /** Returns an read-only iterator of all the checkers and their names */
  listCheckersEntries(): MapIterator<[string, HealthChecker<Ctx>]> {
    return this.checkers.entries();
  }

  /**
   * Removes a checker from the list of checkers to be executed
   *
   * @returns `true` if all provided checkers were removed, `false` otherwise
   */
  removeChecker(...checkerNames: string[]): boolean {
    let allRemoved = true;

    for (const name of checkerNames) {
      const deleted = this.checkers.delete(name);

      if (!deleted) {
        allRemoved = false;
      }
    }

    return allRemoved;
  }

  /**
   * Returns a shallow copy of the last health check result with debug information if it's
   * set
   *
   * - `debug` defaults to `false`
   */
  getLastCheck(debug = false): HealthCheckResult | null {
    if (!this.lastCheck) {
      return null;
    }

    return {
      status: this.lastCheck.status,
      services: debug ? this.lastCheck.services : {}
    };
  }

  /**
   * Performs a health check and returns the result
   *
   * - `debug` defaults to `false`
   */
  async performCheck(debug = false): Promise<HealthCheckResult> {
    let status = HealthStatus.HEALTHY;
    const services: Record<string, DetailedHealthCheck> = {};

    for await (const [serviceName, result] of Array.from(
      this.checkers,
      this.executeChecker,
      this
    )) {
      if (result.status === HealthStatus.UNHEALTHY) {
        status = HealthStatus.UNHEALTHY;
      }

      services[serviceName] = result;
    }

    // updates the last check result
    this.lastCheck = {
      status,
      services
    };

    return this.getLastCheck(debug)!;
  }

  /**
   * Runs a single health check and returns the result
   *
   * **This function never throws**
   */
  protected async executeChecker([name, checker]: [string, HealthChecker<Ctx>]): Promise<
    [string, DetailedHealthCheck]
  > {
    try {
      const check = await checker(this.context);

      switch (typeof check) {
        case 'string':
          return [name, { status: check }];
        case 'object':
          return [name, check];
        default:
          return [name, { status: HealthStatus.HEALTHY }];
      }
    } catch (error: any) {
      this.errorLogger?.(error, checker.name);

      return [
        name,
        {
          status: HealthStatus.UNHEALTHY,
          debug: { error }
        }
      ];
    }
  }

  /**
   * Bound function to be passed as reference that performs the background check and calls
   * the `onBackgroundCheck` callback if it's set
   */
  protected async performBackgroundCheck(): Promise<void> {
    const result = await this.performCheck(true);

    // Calls the onBackgroundCheck callback if it's set
    if (this.onBackgroundCheck) {
      try {
        await this.onBackgroundCheck(result);
      } catch (error) {
        // nothing we can do if there isn't a logger
        this.errorLogger?.(error, 'onBackgroundCheck');
      }
    }

    // Runs the background check again with the same interval
    // unless it was manually removed
    this.backgroundCheckTimer?.refresh();
  }

  /** Starts the background check if it's not already running */
  startBackgroundCheck(interval: number) {
    if (
      // already running
      this.backgroundCheckTimer ||
      // invalid interval
      interval < 1
    ) {
      return;
    }

    // Un-refs the timer so it doesn't keep the process running
    this.backgroundCheckTimer = setTimeout(
      this.performBackgroundCheck.bind(this),
      interval
    ).unref();
  }

  /** Stops the background check if it's running */
  stopBackgroundCheck(): void {
    if (!this.backgroundCheckTimer) {
      return;
    }

    clearTimeout(this.backgroundCheckTimer);
    this.backgroundCheckTimer = undefined;
  }

  // to be used as `using medicus = new Medicus()`
  [Symbol.dispose]() {
    return this.stopBackgroundCheck();
  }
}
