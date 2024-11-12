import assert from 'node:assert';
import test, { describe, it } from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { HealthStatus, Medicus } from '../src';

describe('Medicus', () => {
  it('returns healthy when no checkers are added', async () => {
    using medicus = new Medicus({});

    const result = await medicus.performCheck();

    assert.deepStrictEqual(result, {
      status: HealthStatus.HEALTHY,
      services: {}
    });
  });

  it('registers multiple checkers', async () => {
    using medicus = new Medicus({});

    medicus.addChecker({
      firstChecker() {
        return HealthStatus.HEALTHY;
      },
      secondChecker() {
        return HealthStatus.UNHEALTHY;
      }
    });

    const result = await medicus.performCheck();

    assert.deepStrictEqual(result, {
      status: HealthStatus.UNHEALTHY,
      services: {
        firstChecker: {
          status: HealthStatus.HEALTHY
        },
        secondChecker: {
          status: HealthStatus.UNHEALTHY
        }
      }
    });
  });

  it('returns unhealthy when a checker fails', async () => {
    using medicus = new Medicus({
      checkers: {
        alwaysFails() {
          return HealthStatus.UNHEALTHY;
        }
      }
    });

    const result = await medicus.performCheck();

    assert.deepStrictEqual(result, {
      status: HealthStatus.UNHEALTHY,
      services: {
        alwaysFails: {
          status: HealthStatus.UNHEALTHY
        }
      }
    });
  });

  it('supports all kinds of returns', async () => {
    using medicus = new Medicus({
      checkers: {
        returnsEnum() {
          return HealthStatus.DEGRADED;
        },
        returnsDetailed() {
          return {
            status: HealthStatus.HEALTHY,
            debug: {
              debugProperty: 'debugValue'
            }
          };
        },
        returnsVoid() {},
        async returnsPromiseEnum() {
          return HealthStatus.HEALTHY;
        },
        async returnsPromiseDetailed() {
          return {
            status: HealthStatus.DEGRADED,
            debug: {
              debugAsyncProperty: 'debugAsyncValue'
            }
          };
        },
        async returnsPromiseVoid() {},
        async rejectsPromiseVoid() {
          throw new Error('Promise void error');
        }
      }
    });

    const result = await medicus.performCheck();

    assert.deepStrictEqual(result, {
      status: HealthStatus.UNHEALTHY,
      services: {
        returnsEnum: {
          status: HealthStatus.DEGRADED
        },
        returnsDetailed: {
          status: HealthStatus.HEALTHY,
          debug: {
            debugProperty: 'debugValue'
          }
        },
        returnsVoid: {
          status: HealthStatus.HEALTHY
        },
        returnsPromiseEnum: {
          status: HealthStatus.HEALTHY
        },
        returnsPromiseDetailed: {
          status: HealthStatus.DEGRADED,
          debug: {
            debugAsyncProperty: 'debugAsyncValue'
          }
        },
        returnsPromiseVoid: {
          status: HealthStatus.HEALTHY
        },
        rejectsPromiseVoid: {
          status: HealthStatus.UNHEALTHY,
          debug: { error: 'Error: Promise void error' }
        }
      }
    });
  });

  it('throws on adding two checkers with the same name', () => {
    using medicus = new Medicus();

    medicus.addChecker({ checker() {} });

    assert.throws(() => {
      medicus.addChecker({ checker() {} });
    });
  });

  test('removes a checker at runtime', async (t) => {
    await t.test('by reference', async () => {
      using medicus = new Medicus();

      function checker() {
        return HealthStatus.HEALTHY;
      }

      medicus.addChecker({ checker });

      let result = await medicus.performCheck();

      assert.deepStrictEqual(result, {
        status: HealthStatus.HEALTHY,
        services: {
          checker: {
            status: HealthStatus.HEALTHY
          }
        }
      });

      medicus.removeChecker(checker);

      result = await medicus.performCheck();

      assert.deepStrictEqual(result, {
        status: HealthStatus.HEALTHY,
        services: {}
      });
    });

    await t.test('by name', async () => {
      using medicus = new Medicus();

      medicus.addChecker({
        checker() {
          return HealthStatus.HEALTHY;
        }
      });

      let result = await medicus.performCheck();

      assert.deepStrictEqual(result, {
        status: HealthStatus.HEALTHY,
        services: {
          checker: {
            status: HealthStatus.HEALTHY
          }
        }
      });

      medicus.removeChecker('checker');

      result = await medicus.performCheck();

      assert.deepStrictEqual(result, {
        status: HealthStatus.HEALTHY,
        services: {}
      });
    });
  });

  it('returns lastCheck()', async () => {
    using medicus = new Medicus();

    assert.deepStrictEqual(medicus.getLastCheck(), null);

    const firstCheck = await medicus.performCheck();

    assert.deepStrictEqual(medicus.getLastCheck(), firstCheck);

    const secondCheck = await medicus.performCheck();

    assert.deepStrictEqual(medicus.getLastCheck(), secondCheck);
  });

  it('logs when an error happens', async () => {
    let loggedError: any = null;

    using medicus = new Medicus({
      checkers: {
        alwaysFails() {
          throw new Error('This is an error');
        }
      },
      errorLogger: (error, checkerName) => {
        loggedError = { error, checkerName };
      }
    });

    await medicus.performCheck();

    assert(loggedError !== null);
    assert(loggedError.error instanceof Error);
    assert.strictEqual(loggedError.checkerName, 'alwaysFails');
  });

  it('runs checks in the background', async () => {
    using medicus = new Medicus({
      checkers: { success() {} },
      backgroundCheckInterval: 10,
      manualClearBackgroundCheck: true
    });

    assert.equal(medicus.getLastCheck(), null);

    await setTimeout(20);

    assert.deepStrictEqual(medicus.getLastCheck(), {
      status: HealthStatus.HEALTHY,
      services: {
        success: {
          status: HealthStatus.HEALTHY
        }
      }
    });
  });
});
