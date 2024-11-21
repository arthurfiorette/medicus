import {
  type DetailedHealthCheck,
  type HealthCheckResult,
  type HealthChecker,
  HealthStatus,
  type MedicusOption
} from './types';

/**
 * A class that can be used to perform health checks on a system
 */
export class Medicus<C = void> {
  private checkers: Map<string, HealthChecker<C>> = new Map();
  private lastCheck: HealthCheckResult | null = null;

  /**
   * The interval id of the background check if it's running
   */
  private backgroundCheckTimer: NodeJS.Timeout | null = null;

  /** Context used for the checkers */
  public context: C;

  constructor(readonly options: MedicusOption<C> = {}) {
    if (this.options.checkers) {
      this.addChecker(this.options.checkers);
    }

    this.context = this.options.context ?? (undefined as C);

    this.startBackgroundCheck();
  }

  /**
   * Adds a new checker to be executed when the health check is run
   */
  addChecker(checkers: Record<string, HealthChecker<C>>): void {
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
  listCheckers(): MapIterator<HealthChecker<C>> {
    return this.checkers.values();
  }

  /**
   * Removes a checker from the list of checkers to be executed
   */
  removeChecker(...checkerOrNames: (HealthChecker<C> | string)[]): void {
    for (const checker of checkerOrNames) {
      this.checkers.delete(typeof checker === 'function' ? checker.name : checker);
    }
  }

  /**
   * Returns the last health check result
   */
  getLastCheck(): HealthCheckResult | null {
    return this.lastCheck;
  }

  /**
   * Performs a health check and returns the result
   */
  async performCheck(): Promise<HealthCheckResult> {
    let status = HealthStatus.HEALTHY;
    const services: Record<string, DetailedHealthCheck> = {};

    for await (const [serviceName, result] of this.#runChecks()) {
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

    return this.lastCheck;
  }

  /**
   * Returns a generator that runs all the health checks and yields the results
   */
  async *#runChecks() {
    for (const [name, checker] of this.checkers) {
      yield this.#executeChecker(checker).then((res) => [name, res] as const);
    }
  }

  /**
   * Runs a single health check and returns the result
   *
   * **This function never throws**
   */
  async #executeChecker(checker: HealthChecker<C>): Promise<DetailedHealthCheck> {
    try {
      const check = await checker(this.context);

      switch (typeof check) {
        case 'string':
          return { status: check };
        case 'object':
          return check;
        default:
          return { status: HealthStatus.HEALTHY };
      }
    } catch (error) {
      this.options.errorLogger?.(error, checker.name);

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
  #performBackgroundCheck = async (): Promise<void> => {
    const result = await this.performCheck();

    // Calls the onBackgroundCheck callback if it's set
    if (this.options.onBackgroundCheck) {
      try {
        await this.options.onBackgroundCheck(result);
      } catch (error) {
        // nothing much we can do if there isn't a logger
        this.options.errorLogger?.(error, 'onBackgroundCheck');
      }
    }

    // Runs the background check again with the same interval
    // unless it was manually removed
    this.backgroundCheckTimer?.refresh();
  };

  /**
   * Starts the background check if it's not already running
   */
  readonly startBackgroundCheck = () => {
    if (
      // already called
      this.backgroundCheckTimer ||
      // no interval set
      !this.options.backgroundCheckInterval
    ) {
      return;
    }

    this.backgroundCheckTimer = setTimeout(
      this.#performBackgroundCheck,
      this.options.backgroundCheckInterval
    );

    // Unrefs the timer so it doesn't keep the process running
    this.backgroundCheckTimer.unref();
  };

  /**
   * Stops the background check if it's running
   */
  readonly stopBackgroundCheck = (): void => {
    if (this.backgroundCheckTimer) {
      clearTimeout(this.backgroundCheckTimer);
      this.backgroundCheckTimer = null;
    }
  };

  /** to be used as `using medicus = new Medicus()` */
  [Symbol.dispose]() {
    this.stopBackgroundCheck();
  }
}
