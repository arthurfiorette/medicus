import type { Context, Env, Handler, Input } from 'hono';
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

export type MedicusVariables<
  E extends Env = Env,
  P extends string = string,
  I extends Input = Input
> = E & {
  Variables: E['Variables'] & {
    medicus: Medicus<Context<MedicusVariables<E, P, I>, P, I>>;
  };
};

export type HonoMedicusOptions<
  E extends Env = Env,
  P extends string = string,
  I extends Input = Input
> = Omit<MedicusOption<Context<MedicusVariables<E, P, I>, P, I>>, 'context'> &
  HonoHealthCheckOptions;

export type HonoHealthCheckHandler<
  E extends Env = Env,
  P extends string = string,
  I extends Input = Input
> = Handler<MedicusVariables<E, P, I>, P, I>;

/**
 * Creates a complete Hono health check handler that parses query parameters
 * and returns a JSON response with the health check result.
 *
 * This handler supports:
 * - `?debug=true` - Include debug information in response
 * - `?last=true` - Return the last cached health check result
 * - `?simulate=healthy|degraded|unhealthy` - Simulate a specific health status
 *
 * Notes:
 * - The integration intentionally keeps a single Medicus instance.
 * - Request context is provided per-check at request time.
 * - The base Medicus context is `null`.
 * - On edge runtimes (for example Cloudflare Workers), background checks are not suitable and should remain disabled.
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
export function createHonoHealthCheckHandler<
  E extends Env = Env,
  P extends string = string,
  I extends Input = Input
>({
  debug,
  headers,
  ...medicusOptions
}: HonoMedicusOptions<E, P, I> = {}): HonoHealthCheckHandler<E, P, I> {
  const defaultDebug = !!debug;
  const defaultHeaders = {
    'cache-control': 'no-cache, no-store, must-revalidate',
    ...headers
  };
  const medicus = new Medicus<Context<MedicusVariables<E, P, I>, P, I>>(medicusOptions);

  return async function honoHealthCheckHandler(c) {
    const last = !!c.req.query('last');
    const debug = !!c.req.query('debug') || defaultDebug;
    const simulate = parseHealthStatus(c.req.query('simulate'));

    c.set('medicus', medicus);

    const check = await performHttpCheck(medicus, debug, last, simulate, c);

    for (const [key, value] of Object.entries(defaultHeaders)) {
      c.header(key, value);
    }

    return c.json(check.result, check.status as 200 | 503);
  };
}
