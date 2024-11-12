import closeWithGrace from 'close-with-grace';
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
export class Medicus {
  private checkers: Map<string, HealthChecker> = new Map();
  private lastCheck: HealthCheckResult | null = null;

  /**
   * The interval id of the background check if it's running
   */
  private backgroundCheckIntervalId: NodeJS.Timeout | null = null;

  constructor(private readonly options: MedicusOption = {}) {
    if (this.options.checkers) {
      this.addChecker(this.options.checkers);
    }

    this.#handleBackgroundCheck();
  }

  /**
   * Adds a new checker to be executed when the health check is run
   */
  addChecker(checkers: Record<string, HealthChecker>): void {
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
  listCheckers(): MapIterator<HealthChecker> {
    return this.checkers.values();
  }

  /**
   * Removes a checker from the list of checkers to be executed
   */
  removeChecker(...checkerOrNames: (HealthChecker | string)[]): void {
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
  performCheck = async (): Promise<HealthCheckResult> => {
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
  };

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
  async #executeChecker(checker: HealthChecker): Promise<DetailedHealthCheck> {
    try {
      const check = await checker();

      switch (typeof check) {
        case 'string':
          return { status: check };
        case 'object':
          return check;
        default:
          return { status: HealthStatus.HEALTHY };
      }
    } catch (error: any) {
      if (this.options.errorLogger) {
        this.options.errorLogger(error, checker.name);
      }

      return {
        status: HealthStatus.UNHEALTHY,
        debug: { error }
      };
    }
  }

  /**
   * Starts the background check if it's not already running
   */
  #handleBackgroundCheck() {
    if (
      // already called
      this.backgroundCheckIntervalId ||
      // no interval set
      !this.options.backgroundCheckInterval
    ) {
      return;
    }

    this.backgroundCheckIntervalId = setInterval(
      this.performCheck,
      this.options.backgroundCheckInterval
    );

    if (!this.options.manualClearBackgroundCheck) {
      closeWithGrace(
        {
          delay: 500,
          logger: this.options.errorLogger ? { error: this.options.errorLogger } : undefined
        },
        this.closeBackgroundCheck
      );
    }
  }

  /**
   * Stops the background check if it's running
   */
  readonly closeBackgroundCheck = (): void => {
    if (this.backgroundCheckIntervalId) {
      clearInterval(this.backgroundCheckIntervalId);
      this.backgroundCheckIntervalId = null;
    }
  };

  /** to be used as `using medicus = new Medicus()` */
  [Symbol.dispose]() {
    this.closeBackgroundCheck();
  }
}
