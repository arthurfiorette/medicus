import type { Context, Handler } from 'hono';
import { Medicus } from '../medicus';
import type { HealthCheckResult, MedicusOption } from '../types';
import { parseHealthStatus, performHttpCheck } from '../utils/http';

export interface HonoHealthCheckOptions {
  /**
   * Whether to include debug information in the response by default
   *
   * @default false
   */
  debug?: boolean;

  /**
   * Custom response headers to include in health check responses
   *
   * @default { 'cache-control': 'no-cache, no-store, must-revalidate' }
   */
  headers?: Record<string, string>;
}

export type HonoMedicusOptions<Ctx = Context> = MedicusOption<Ctx> & HonoHealthCheckOptions;
export type HonoHealthCheckHandler = Handler & { [Symbol.dispose]: () => void };

/**
 * Creates a complete Hono health check handler that parses query parameters
 * and returns a JSON response with the health check result.
 *
 * This handler supports:
 * - `?debug=true` - Include debug information in response
 * - `?last=true` - Return the last cached health check result
 * - `?simulate=healthy|degraded|unhealthy` - Simulate a specific health status
 *
 * @example
 * ```ts
 * import { Hono } from 'hono';
 * import { HealthStatus } from 'medicus';
 * import { createHonoHealthCheckHandler } from 'medicus/hono';
 *
 * const app = new Hono();
 *
 * app.get(
 *   '/health',
 *   createHonoHealthCheckHandler({
 *   checkers: {
 *     database: () => HealthStatus.HEALTHY
 *   }
 *   })
 * );
 * ```
 */
export function createHonoHealthCheckHandler<Ctx = Context>(
  options: HonoMedicusOptions<Ctx> = {}
): HonoHealthCheckHandler {
  const { context, debug, headers, ...medicusOptions } = options;
  const hasExplicitContext = context !== undefined;
  const medicus = hasExplicitContext ? new Medicus({ ...medicusOptions, context }) : null;
  let defaultLastCheck: HealthCheckResult | undefined;
  const defaultDebug = !!debug;
  const defaultHeaders = {
    'cache-control': 'no-cache, no-store, must-revalidate',
    ...headers
  };

  const handler: Handler = async function honoHealthCheckHandler(c: Context) {
    const last = !!c.req.query('last');
    const debug = !!c.req.query('debug') || defaultDebug;
    const simulate = parseHealthStatus(c.req.query('simulate'));
    let check: Awaited<ReturnType<typeof performHttpCheck>>;

    if (hasExplicitContext) {
      check = await performHttpCheck(medicus!, debug, last, simulate);
    } else {
      const activeMedicus = createRequestMedicus(c as Ctx);

      try {
        check = await performHttpCheck(activeMedicus, debug, last, simulate);
        defaultLastCheck = activeMedicus.lastCheck;
      } finally {
        activeMedicus[Symbol.dispose]();
      }
    }

    for (const [key, value] of Object.entries(defaultHeaders)) {
      c.header(key, value);
    }

    return c.json(check.result, check.status as 200 | 503);
  };

  return Object.assign(handler, {
    [Symbol.dispose]() {
      if (medicus) {
        medicus[Symbol.dispose]();
      }
    }
  });

  function createRequestMedicus(requestContext: Ctx): Medicus<Ctx> {
    const scopedMedicus = new Medicus({
      ...medicusOptions,
      context: requestContext
    });

    if (defaultLastCheck) {
      scopedMedicus.lastCheck = defaultLastCheck;
    }

    return scopedMedicus;
  }
}
