import type { NextApiRequest, NextApiResponse } from 'next';
import type { Medicus } from '../medicus';
import { parseHealthStatus, performHttpCheck } from '../utils/http';

export interface NextApiHealthCheckOptions {
  /**
   * Whether to include debug information in the response by default
   *
   * @default false
   */
  debug?: boolean;
}

/**
 * Next.js API route handler function type for health checks.
 *
 * Compatible with Next.js Pages Router API routes.
 *
 * @param req - Next.js API request object
 * @param res - Next.js API response object
 * @returns Promise that resolves when the response has been sent
 *
 * @example
 * ```ts
 * // pages/api/health.ts
 * import { Medicus, HealthStatus } from 'medicus';
 * import { createNextApiHealthCheckHandler } from 'medicus/nextjs';
 *
 * const medicus = new Medicus({
 *   checkers: {
 *     database: () => HealthStatus.HEALTHY
 *   }
 * });
 *
 * export default createNextApiHealthCheckHandler(medicus);
 * ```
 */
export type NextApiHealthCheckHandler = (
  this: void,
  req: NextApiRequest,
  res: NextApiResponse
) => Promise<void>;

/**
 * Creates a Next.js API route handler for health checks.
 *
 * This handler is designed for use with Next.js Pages Router and supports
 * the same query parameters as other Medicus integrations:
 * - `?debug=true` - Include debug information in response
 * - `?last=true` - Return the last cached health check result
 * - `?simulate=healthy|degraded|unhealthy` - Simulate a specific health status
 *
 * @param medicus - The Medicus instance to use for health checks
 * @param options - Optional configuration for the handler
 * @returns A Next.js API route handler function
 *
 * @example
 * ```ts
 * // pages/api/health.ts
 * import { Medicus, HealthStatus } from 'medicus';
 * import { createNextApiHealthCheckHandler } from 'medicus/nextjs';
 *
 * const medicus = new Medicus({
 *   checkers: {
 *     database: () => HealthStatus.HEALTHY,
 *     redis: async () => {
 *       // Check Redis connection
 *       return HealthStatus.HEALTHY;
 *     }
 *   }
 * });
 *
 * export default createNextApiHealthCheckHandler(medicus);
 * ```
 *
 * @example
 * ```ts
 * // With debug enabled by default
 * export default createNextApiHealthCheckHandler(medicus, {
 *   debug: true
 * });
 * ```
 *
 * @example
 * ```ts
 * // Usage with background checks
 * const medicus = new Medicus({
 *   checkers: {
 *     database: () => HealthStatus.HEALTHY
 *   }
 * });
 *
 * // Start background checks every 30 seconds
 * medicus.startBackgroundCheck(30000);
 *
 * export default createNextApiHealthCheckHandler(medicus);
 * ```
 */
export function createNextApiHealthCheckHandler<Ctx = void>(
  medicus: Medicus<Ctx>,
  options: NextApiHealthCheckOptions = {}
): NextApiHealthCheckHandler {
  const defaultDebug = !!options.debug || false;

  return async function nextApiHealthCheckHandler(req, res) {
    // Parse query parameters
    const query = req.query;
    const last = !!query.last;
    const debug = !!query.debug || defaultDebug;
    const simulate = parseHealthStatus(
      typeof query.simulate === 'string' ? query.simulate : undefined
    );

    // Perform health check
    const check = await performHttpCheck(medicus, debug, last, simulate);

    // Set headers
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    // Send response
    res.status(check.status).json(check.result);
  };
}
