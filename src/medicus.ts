import internal from 'node:stream';
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

/**
 * A class that can be used to perform health checks on a system
 */
export class Medicus<Ctx = void> {
  /** The interval id of the background check if it's running */
  protected backgroundCheckTimer: NodeJS.Timeout | undefined;

  /**
   * A map of all the checkers that will be executed when the health check is run
   * with the key being the name of the checker
   */
  protected checkers: Map<string, HealthChecker<Ctx>> = new Map();

  /**
   * The context that will be passed to all the checkers when they
   * get executed
   */
  protected context: Ctx = null as Ctx;

  /**
   * The error logger function that will be called whenever an error occurs
   * during the execution of a health check
   */
  protected errorLogger: MedicusErrorLogger;

  /**
   * The last health check result, this is updated every time a health check
   * is run and can be accessed with `getLastCheck`
   */
  protected lastCheck: HealthCheckResult | undefined;

  /**
   * The background check defined by the constructor, you can freely change this
   * to another function or delete it if needed.
   */
  public backgroundCheckListener: BackgroundCheckListener | undefined;

  constructor(options: MedicusOption<Ctx> = {}) {
    this.context = options.context!;
    this.errorLogger = options.errorLogger!;
    this.backgroundCheckListener = options.onBackgroundCheck!;

    if (options.checkers) {
      this.addChecker(options.checkers);
    }

    if (options.backgroundCheckInterval) {
      this.startBackgroundCheck(options.backgroundCheckInterval);
    }
  }

  /**
   * Adds a new checker to be executed when the health check is run
   */
  addChecker(checkers: HealthCheckerMap<Ctx>): void {
    for (const name in checkers) {
      if (this.checkers.has(name)) {
        throw new Error(`A checker with the name "${name}" is already registered`);
      }

      this.checkers.set(name, checkers[name]!);
    }
  }

  /**
   * Returns an read-only iterator of all the checkers
   */
  listCheckers(): MapIterator<HealthChecker<Ctx>> {
    return this.checkers.values();
  }

  /**
   * Removes a checker from the list of checkers to be executed
   *
   * @returns `true` if all provided checkers were removed, `false` otherwise
   */
  removeChecker(...checkerNames: string[]): boolean {
    let allRemoved = true;

    for (const name of checkerNames) {
      allRemoved &&= this.checkers.delete(name);
    }

    return allRemoved;
  }

  /**
   * Returns the last health check result with debug information if it's set
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

    for await (const [serviceName, result] of Array.from(this.checkers, this.mapChecker)) {
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
   * Simple helper function to yield the result of a health check
   */
  protected readonly mapChecker = async ([name, checker]: [
    name: string,
    checker: HealthChecker<Ctx>
  ]) => {
    return [name, await this.executeChecker(checker)] as const;
  };

  /**
   * Runs a single health check and returns the result
   *
   * **This function never throws**
   */
  protected async executeChecker(checker: HealthChecker<Ctx>): Promise<DetailedHealthCheck> {
    try {
      const check = await checker(this.context!);

      switch (typeof check) {
        case 'string':
          return { status: check };
        case 'object':
          return check;
        default:
          return { status: HealthStatus.HEALTHY };
      }
    } catch (error) {
      this.errorLogger?.(error, checker.name);

      return {
        status: HealthStatus.UNHEALTHY,
        debug: { error: String(error) }
      };
    }
  }

  /**
   * Bound function to be passed as reference that performs the background check
   * and calls the `onBackgroundCheck` callback if it's set
   */
  protected performBackgroundCheck = async (): Promise<void> => {
    const result = await this.performCheck(true);

    // Calls the onBackgroundCheck callback if it's set
    if (this.backgroundCheckListener) {
      try {
        await this.backgroundCheckListener(result);
      } catch (error) {
        // nothing we can do if there isn't a logger
        this.errorLogger?.(error, 'onBackgroundCheck');
      }
    }

    // Runs the background check again with the same interval
    // unless it was manually removed
    this.backgroundCheckTimer?.refresh();
  };

  /**
   * Starts the background check if it's not already running
   */
  readonly startBackgroundCheck = (interval: number) => {
    if (
      // already running
      this.backgroundCheckTimer ||
      // invalid interval
      interval < 0
    ) {
      return;
    }

    this.backgroundCheckTimer = setTimeout(this.performBackgroundCheck, interval);

    // Unrefs the timer so it doesn't keep the process running
    this.backgroundCheckTimer.unref();
  };

  /** Stops the background check if it's running */
  readonly stopBackgroundCheck = (): void => {
    if (!this.backgroundCheckTimer) {
      return;
    }

    clearTimeout(this.backgroundCheckTimer);
    this.backgroundCheckTimer = undefined;
  };

  // to be used as `using medicus = new Medicus()`
  readonly [Symbol.dispose] = this.stopBackgroundCheck;
}
