import assert from 'node:assert';
import test, { describe, it } from 'node:test';
import fastify from 'fastify';
import { HealthStatus, Medicus } from '../../src';
import { medicusPlugin } from '../../src/integrations/fastify';

// describe('Medicus', () => {
//   it('returns healthy when no checkers are added', async () => {
//     using medicus = new Medicus({});

//     const result = await medicus.performCheck();

//     assert.deepStrictEqual(result, {
//       status: HealthStatus.HEALTHY,
//       services: {}
//     });
//   });

//   it('throws when registering anonymous checkers', () => {
//     using medicus = new Medicus();

//     assert.throws(() => {
//       medicus.addChecker(() => {});
//     });
//   });

//   it('registers multiple checkers', async () => {
//     using medicus = new Medicus({});

//     medicus.addChecker(
//       function firstChecker() {
//         return HealthStatus.HEALTHY;
//       },
//       function secondChecker() {
//         return HealthStatus.UNHEALTHY;
//       }
//     );

//     const result = await medicus.performCheck();

//     assert.deepStrictEqual(result, {
//       status: HealthStatus.UNHEALTHY,
//       services: {
//         firstChecker: {
//           status: HealthStatus.HEALTHY
//         },
//         secondChecker: {
//           status: HealthStatus.UNHEALTHY
//         }
//       }
//     });
//   });

//   it('returns unhealthy when a checker fails', async () => {
//     using medicus = new Medicus({
//       checkers: [
//         function alwaysFails() {
//           return HealthStatus.UNHEALTHY;
//         }
//       ]
//     });

//     const result = await medicus.performCheck();

//     assert.deepStrictEqual(result, {
//       status: HealthStatus.UNHEALTHY,
//       services: {
//         alwaysFails: {
//           status: HealthStatus.UNHEALTHY
//         }
//       }
//     });
//   });

//   it('supports all kinds of returns', async () => {
//     const createdError = new Error('Promise void error');

//     using medicus = new Medicus({
//       checkers: [
//         function returnsEnum() {
//           return HealthStatus.DEGRADED;
//         },
//         function returnsDetailed() {
//           return {
//             status: HealthStatus.HEALTHY,
//             debug: {
//               debugProperty: 'debugValue'
//             }
//           };
//         },
//         function returnsVoid() {},
//         async function returnsPromiseEnum() {
//           return HealthStatus.HEALTHY;
//         },
//         async function returnsPromiseDetailed() {
//           return {
//             status: HealthStatus.DEGRADED,
//             debug: {
//               debugAsyncProperty: 'debugAsyncValue'
//             }
//           };
//         },
//         async function returnsPromiseVoid() {},
//         async function rejectsPromiseVoid() {
//           throw createdError;
//         }
//       ]
//     });

//     const result = await medicus.performCheck();

//     assert.deepStrictEqual(result, {
//       status: HealthStatus.UNHEALTHY,
//       services: {
//         returnsEnum: {
//           status: HealthStatus.DEGRADED
//         },
//         returnsDetailed: {
//           status: HealthStatus.HEALTHY,
//           debug: {
//             debugProperty: 'debugValue'
//           }
//         },
//         returnsVoid: {
//           status: HealthStatus.HEALTHY
//         },
//         returnsPromiseEnum: {
//           status: HealthStatus.HEALTHY
//         },
//         returnsPromiseDetailed: {
//           status: HealthStatus.DEGRADED,
//           debug: {
//             debugAsyncProperty: 'debugAsyncValue'
//           }
//         },
//         returnsPromiseVoid: {
//           status: HealthStatus.HEALTHY
//         },
//         rejectsPromiseVoid: {
//           status: HealthStatus.UNHEALTHY,
//           debug: { error: createdError }
//         }
//       }
//     });
//   });

//   it('throws on adding two checkers with the same name', () => {
//     using medicus = new Medicus();

//     medicus.addChecker(function checker() {});

//     assert.throws(() => {
//       medicus.addChecker(function checker() {});
//     });
//   });

//   test('removes a checker at runtime', async (t) => {
//     await t.test('by reference', async () => {
//       using medicus = new Medicus();

//       function checker() {
//         return HealthStatus.HEALTHY;
//       }

//       medicus.addChecker(checker);

//       let result = await medicus.performCheck();

//       assert.deepStrictEqual(result, {
//         status: HealthStatus.HEALTHY,
//         services: {
//           checker: {
//             status: HealthStatus.HEALTHY
//           }
//         }
//       });

//       medicus.removeChecker(checker);

//       result = await medicus.performCheck();

//       assert.deepStrictEqual(result, {
//         status: HealthStatus.HEALTHY,
//         services: {}
//       });
//     });

//     await t.test('by name', async () => {
//       using medicus = new Medicus();

//       medicus.addChecker(function checker() {
//         return HealthStatus.HEALTHY;
//       });

//       let result = await medicus.performCheck();

//       assert.deepStrictEqual(result, {
//         status: HealthStatus.HEALTHY,
//         services: {
//           checker: {
//             status: HealthStatus.HEALTHY
//           }
//         }
//       });

//       medicus.removeChecker('checker');

//       result = await medicus.performCheck();

//       assert.deepStrictEqual(result, {
//         status: HealthStatus.HEALTHY,
//         services: {}
//       });
//     });
//   });

//   it('returns lastCheck()', async () => {
//     using medicus = new Medicus();

//     assert.deepStrictEqual(medicus.getLastCheck(), null);

//     const firstCheck = await medicus.performCheck();

//     assert.deepStrictEqual(medicus.getLastCheck(), firstCheck);

//     const secondCheck = await medicus.performCheck();

//     assert.deepStrictEqual(medicus.getLastCheck(), secondCheck);
//   });

//   it('logs when an error happens', async () => {
//     let loggedError: any = null;

//     using medicus = new Medicus({
//       checkers: [
//         function alwaysFails() {
//           throw new Error('This is an error');
//         }
//       ],
//       errorLogger: (error, checkerName) => {
//         loggedError = { error, checkerName };
//       }
//     });

//     await medicus.performCheck();

//     assert(loggedError !== null);
//     assert(loggedError.error instanceof Error);
//     assert.strictEqual(loggedError.checkerName, 'alwaysFails');
//   });

//   it('runs checks in the background', async () => {
//     using medicus = new Medicus({
//       checkers: [function success() {}],
//       backgroundCheckInterval: 10,
//       manualClearBackgroundCheck: true
//     });

//     assert.equal(medicus.getLastCheck(), null);

//     await setTimeout(20);

//     assert.deepStrictEqual(medicus.getLastCheck(), {
//       status: HealthStatus.HEALTHY,
//       services: {
//         success: {
//           status: HealthStatus.HEALTHY
//         }
//       }
//     });
//   });
// });

describe('medicusPlugin()', () => {
  it('registers a health check route', async () => {
    await using app = fastify();
    await app.register(medicusPlugin, {});

    assert.ok(app.medicus instanceof Medicus);

    const response = await app.inject({
      method: 'GET',
      url: '/health'
    });

    assert.deepStrictEqual(response.json(), {
      status: HealthStatus.HEALTHY,
      services: {}
    });
  });

  it('uses cached version when ?last=true', async () => {
    await using app = fastify();

    let last = false;

    await app.register(medicusPlugin, {
      checkers: {
        async checker() {
          last = !last;
          return last ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY;
        }
      }
    });

    const response = await app.inject({
      method: 'GET',
      url: '/health?last=true'
    });

    assert.deepStrictEqual(response.json(), {
      status: HealthStatus.HEALTHY,
      services: {}
    });

    const response2 = await app.inject({
      method: 'GET',
      url: '/health?last=true'
    });

    assert.deepStrictEqual(response2.json(), {
      // cached
      status: HealthStatus.HEALTHY,
      services: {}
    });
  });

  it('uses new version when ?last=false', async () => {
    await using app = fastify();

    let last = false;

    await app.register(medicusPlugin, {
      checkers: {
        async checker() {
          last = !last;
          return last ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY;
        }
      }
    });

    const response = await app.inject({
      method: 'GET',
      url: '/health?last=false'
    });

    assert.deepStrictEqual(response.json(), {
      status: HealthStatus.HEALTHY,
      services: {}
    });

    const response2 = await app.inject({
      method: 'GET',
      url: '/health?last=false'
    });

    assert.deepStrictEqual(response2.json(), {
      // not cached
      status: HealthStatus.UNHEALTHY,
      services: {}
    });
  });

  it('auto registers under-pressure checker', async () => {
    await using app = fastify();
    await app.register(import('@fastify/under-pressure'));
    await app.register(medicusPlugin, {
      debug: true
    });

    const response = await app.inject({
      method: 'GET',
      url: '/health'
    });

    assert.deepStrictEqual(response.json(), {
      // non debug
      status: HealthStatus.HEALTHY,
      services: {
        pressure: {
          status: HealthStatus.HEALTHY,
          // idk why its 0 but not our concern
          debug: { eventLoopDelay: 0, rssBytes: 0, heapUsed: 0, eventLoopUtilized: 0 }
        }
      }
    });
  });

  it('works with per request debug', async () => {
    await using app = fastify();
    await app.register(medicusPlugin, {
      checkers: {
        request() {
          return {
            status: HealthStatus.HEALTHY,
            debug: {
              request: 'debug'
            }
          };
        }
      },
      debug(req) {
        return req.headers['x-debug'] === '1233';
      }
    });

    const response1 = await app.inject({
      method: 'GET',
      url: '/health',
      headers: {
        'x-debug': '1233'
      }
    });

    assert.deepStrictEqual(response1.json(), {
      status: HealthStatus.HEALTHY,
      services: {
        request: {
          status: HealthStatus.HEALTHY,
          debug: {
            request: 'debug'
          }
        }
      }
    });

    const response2 = await app.inject({
      method: 'GET',
      url: '/health'
    });

    assert.deepStrictEqual(response2.json(), {
      status: HealthStatus.HEALTHY,
      services: {}
    });

    const response3 = await app.inject({
      method: 'GET',
      url: '/health',
      headers: {
        'x-debug': 'not 1233'
      }
    });

    assert.deepStrictEqual(response3.json(), {
      status: HealthStatus.HEALTHY,
      services: {}
    });
  });
});
