import type { Context, Handler } from 'hono';
import { Medicus } from '../medicus';
import type { MedicusOption } from '../types';
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
  const medicus = new Medicus(medicusOptions);
  if (hasExplicitContext) {
    medicus.context = context;
  }
  const defaultDebug = !!debug;
  const defaultHeaders = {
    'cache-control': 'no-cache, no-store, must-revalidate',
    ...headers
  };

  const handler: Handler = async function honoHealthCheckHandler(c: Context) {
    if (!hasExplicitContext) {
      medicus.context = c as Ctx;
    }

    const last = !!c.req.query('last');
    const debug = !!c.req.query('debug') || defaultDebug;
    const simulate = parseHealthStatus(c.req.query('simulate'));

    const check = await performHttpCheck(medicus, debug, last, simulate);

    for (const [key, value] of Object.entries(defaultHeaders)) {
      c.header(key, value);
    }

    return c.json(check.result, check.status as 200 | 503);
  };

  return Object.assign(handler, {
    [Symbol.dispose]() {
      return medicus[Symbol.dispose]();
    }
  });
}
