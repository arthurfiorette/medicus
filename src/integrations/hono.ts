import type { Handler } from 'hono';
import type { Medicus } from '../medicus';
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
 * import { Medicus, HealthStatus } from 'medicus';
 * import { createHonoHealthCheckHandler } from 'medicus/hono';
 *
 * const app = new Hono();
 *
 * const medicus = new Medicus({
 *   checkers: {
 *     database: () => HealthStatus.HEALTHY
 *   }
 * });
 *
 * app.get('/health', createHonoHealthCheckHandler(medicus));
 * ```
 */
export function createHonoHealthCheckHandler<Ctx = void>(
  medicus: Medicus<Ctx>,
  options: HonoHealthCheckOptions = {}
): Handler {
  const defaultDebug = !!options.debug;
  const defaultHeaders = {
    'cache-control': 'no-cache, no-store, must-revalidate',
    ...options.headers
  };

  return async function honoHealthCheckHandler(c) {
    const last = !!c.req.query('last');
    const debug = !!c.req.query('debug') || defaultDebug;
    const simulate = parseHealthStatus(c.req.query('simulate'));

    const check = await performHttpCheck(medicus, debug, last, simulate);

    for (const [key, value] of Object.entries(defaultHeaders)) {
      c.header(key, value);
    }

    return c.json(check.result, check.status as 200 | 503);
  };
}
