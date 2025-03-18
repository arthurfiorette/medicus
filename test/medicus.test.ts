import assert from 'node:assert';
import test, { describe, it } from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { HealthStatus, Medicus, definePlugin } from '../src';

describe('Medicus', () => {
  it('returns healthy when no checkers are added', async () => {
    using medicus = new Medicus({});

    const result = await medicus.performCheck(true);

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

    const result = await medicus.performCheck(true);

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

    const result = await medicus.performCheck(true);

    assert.deepStrictEqual(result, {
      status: HealthStatus.UNHEALTHY,
      services: {
        alwaysFails: {
          status: HealthStatus.UNHEALTHY
        }
      }
    });
  });

  it('supports all kinds of returns', async (ctx) => {
    const mock = ctx.mock.method(console, 'error', () => {}, { times: 1 });

    const err = new Error('Promise void error');

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
          throw err;
        }
      }
    });

    const result = await medicus.performCheck(true);

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
          debug: { error: err }
        }
      }
    });

    assert.equal(mock.mock.callCount(), 1);
  });

  it('throws on adding two checkers with the same name', () => {
    using medicus = new Medicus({});

    medicus.addChecker({ checker() {} });

    assert.throws(() => {
      medicus.addChecker({ checker() {} });
    });
  });

  test('removes a checker at runtime by name', async () => {
    using medicus = new Medicus({});

    medicus.addChecker({
      checker() {
        return HealthStatus.HEALTHY;
      }
    });

    let result = await medicus.performCheck(true);

    assert.deepStrictEqual(result, {
      status: HealthStatus.HEALTHY,
      services: {
        checker: {
          status: HealthStatus.HEALTHY
        }
      }
    });

    medicus.removeChecker('checker');

    result = await medicus.performCheck(true);

    assert.deepStrictEqual(result, {
      status: HealthStatus.HEALTHY,
      services: {}
    });
  });

  test('removeChecker returns false when an non existing checker name is provided', async () => {
    using medicus = new Medicus({});

    medicus.addChecker({
      checker() {
        return HealthStatus.HEALTHY;
      }
    });

    const removed = medicus.removeChecker('invalid');

    assert.deepStrictEqual(removed, false);

    const result = await medicus.performCheck(true);

    assert.deepStrictEqual(result, {
      status: HealthStatus.HEALTHY,
      services: {
        checker: {
          status: HealthStatus.HEALTHY
        }
      }
    });
  });

  it('returns lastCheck()', async () => {
    using medicus = new Medicus({});

    assert.deepStrictEqual(medicus.getLastCheck(), null);

    const firstCheck = await medicus.performCheck(true);

    assert.deepStrictEqual(medicus.getLastCheck(), firstCheck);

    const secondCheck = await medicus.performCheck(true);

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

    await medicus.performCheck(true);

    assert(loggedError !== null);
    assert(loggedError.error instanceof Error);
    assert.strictEqual(loggedError.checkerName, 'alwaysFails');
  });

  it('hides information when debug=false', async () => {
    using medicus = new Medicus({
      checkers: {
        success() {}
      }
    });

    const result = await medicus.performCheck(false);

    assert.deepStrictEqual(result, {
      status: HealthStatus.HEALTHY,
      services: {}
    });

    const detailedResult = await medicus.performCheck(true);

    assert.deepStrictEqual(detailedResult, {
      status: HealthStatus.HEALTHY,
      services: {
        success: {
          status: HealthStatus.HEALTHY
        }
      }
    });

    const defaultResult = await medicus.performCheck();

    assert.deepStrictEqual(defaultResult, {
      status: HealthStatus.HEALTHY,
      services: {}
    });
  });

  it('runs checks in the background', async () => {
    using medicus = new Medicus({
      checkers: { success() {} },
      backgroundCheckInterval: 10
    });

    assert.equal(medicus.getLastCheck(), null);

    await setTimeout(20);

    assert.deepStrictEqual(medicus.getLastCheck(true), {
      status: HealthStatus.HEALTHY,
      services: {
        success: {
          status: HealthStatus.HEALTHY
        }
      }
    });
  });

  it('calls onBackgroundCheck when a health check runs in the background', async () => {
    let onBackgroundCheckCalled = false;
    let param: any;

    using medicus = new Medicus({
      checkers: { success() {} },
      backgroundCheckInterval: 10,
      onBackgroundCheck(p) {
        param = p;
        onBackgroundCheckCalled = true;
      }
    });

    assert.equal(medicus.getLastCheck(), null);

    await setTimeout(20);

    assert(onBackgroundCheckCalled);
    assert.deepStrictEqual(param, medicus.getLastCheck(true));
  });

  it('does not call onBackgroundCheck if an invalid interval is set', async () => {
    let onBackgroundCheckCalled = false;
    let param: any;

    using medicus = new Medicus({
      checkers: { success() {} },
      backgroundCheckInterval: 0,
      onBackgroundCheck(p) {
        param = p;
        onBackgroundCheckCalled = true;
      }
    });

    assert.equal(medicus.getLastCheck(), null);

    await setTimeout(10);

    assert.equal(onBackgroundCheckCalled, false);
    assert.equal(param, undefined);
  });

  it('calls errorLogger when onBackgroundCheck throws', async () => {
    let loggedError: any = null;

    using medicus = new Medicus({
      checkers: { success() {} },
      backgroundCheckInterval: 10,
      onBackgroundCheck() {
        throw new Error('This is an error');
      },
      errorLogger: (error, checkerName) => {
        loggedError = { error, checkerName };
      }
    });

    // calling multiple times does nothing
    medicus.startBackgroundCheck(10);
    medicus.startBackgroundCheck(10);
    medicus.startBackgroundCheck(10);

    await setTimeout(20);

    assert(loggedError !== null);
    assert(loggedError.error instanceof Error);
    assert.strictEqual(loggedError.checkerName, 'onBackgroundCheck');
  });

  it('tests all plugin options', async () => {
    const plugin = definePlugin<void>(() => ({
      name: 'test',
      checkers: {
        pluginChecker() {
          return HealthStatus.HEALTHY;
        }
      },
      configure(options) {
        options.checkers = {
          ...options.checkers,
          configuredChecker() {
            return HealthStatus.HEALTHY;
          }
        };
      },
      created(medicus) {
        medicus.addChecker({
          createdChecker() {
            return HealthStatus.HEALTHY;
          }
        });
      }
    }));

    using medicus = new Medicus({
      plugins: [plugin()],
      checkers: {
        rootChecker() {
          return HealthStatus.HEALTHY;
        }
      }
    });

    const result = await medicus.performCheck(true);

    assert.deepStrictEqual(result, {
      status: HealthStatus.HEALTHY,
      services: {
        pluginChecker: {
          status: HealthStatus.HEALTHY
        },
        configuredChecker: {
          status: HealthStatus.HEALTHY
        },
        createdChecker: {
          status: HealthStatus.HEALTHY
        },
        rootChecker: {
          status: HealthStatus.HEALTHY
        }
      }
    });
  });

  test('list all checkers', async () => {
    const plugin = definePlugin<void>(() => ({
      name: 'test',
      checkers: {
        pluginChecker() {
          return HealthStatus.HEALTHY;
        }
      },
      configure(options) {
        options.checkers = {
          ...options.checkers,
          configuredChecker() {
            return HealthStatus.HEALTHY;
          }
        };
      },
      created(medicus) {
        medicus.addChecker({
          createdChecker() {
            return HealthStatus.HEALTHY;
          }
        });
      }
    }));

    using medicus = new Medicus({
      plugins: [plugin()],
      checkers: {
        rootChecker() {
          return HealthStatus.HEALTHY;
        }
      }
    });

    let checkers = Array.from(medicus.listCheckers());

    assert.strictEqual(checkers.length, 4);

    medicus.removeChecker('rootChecker');

    checkers = Array.from(medicus.listCheckers());

    assert.strictEqual(checkers.length, 3);
    assert.strictEqual(medicus.countCheckers(), 3);
  });
});
