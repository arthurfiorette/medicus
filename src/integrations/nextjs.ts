import type { NextApiRequest, NextApiResponse } from 'next';
import { Medicus } from '../medicus';
import type { MedicusOption } from '../types';
import { parseHealthStatus, performHttpCheck } from '../utils/http';

/** A detector function that can be used to determine if the debug output should be shown */
export type DebugDetector = boolean | ((req: NextApiRequest) => boolean | Promise<boolean>);

export interface NextApiHealthCheckOptions {
  /**
   * Whether to include debug information in the response by default.
   * Can be a boolean or a function that receives the request and returns a boolean.
   * Use a function to conditionally show debug info based on authentication or other request properties.
   *
   * @default false
   *
   * @example
   * ```ts
   * // Always show debug
   * { debug: true }
   *
   * // Conditionally show debug based on auth
   * { debug: (req) => req.headers.authorization === 'Bearer secret' }
   * ```
   */
  debug?: DebugDetector;
}

/**
 * Options for creating a Next.js health check handler when not passing a Medicus instance.
 * Combines MedicusOption with NextApiHealthCheckOptions.
 */
export type NextApiMedicusOptions<Ctx = void> = MedicusOption<Ctx> & NextApiHealthCheckOptions;

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
 * @param medicusOrOptions - Either a Medicus instance or MedicusOption to create one
 * @param options - Optional configuration (only used when first param is a Medicus instance)
 * @returns A Next.js API route handler function
 *
 * @example
 * ```ts
 * // pages/api/health.ts
 * import { createNextApiHealthCheckHandler } from 'medicus/nextjs';
 * import { HealthStatus } from 'medicus';
 *
 * // Pass options directly - Medicus instance created automatically
 * export default createNextApiHealthCheckHandler({
 *   checkers: {
 *     database: () => HealthStatus.HEALTHY,
 *     redis: async () => {
 *       // Check Redis connection
 *       return HealthStatus.HEALTHY;
 *     }
 *   }
 * });
 * ```
 *
 * @example
 * ```ts
 * // With conditional debug based on authentication
 * export default createNextApiHealthCheckHandler({
 *   checkers: {
 *     database: () => HealthStatus.HEALTHY
 *   },
 *   debug: (req) => req.headers.authorization === 'Bearer secret-token'
 * });
 * ```
 *
 * @example
 * ```ts
 * // Pass a pre-created Medicus instance
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
 * export default createNextApiHealthCheckHandler({
 *   checkers: {
 *     database: () => HealthStatus.HEALTHY
 *   },
 *   backgroundCheckInterval: 30000 // Run checks every 30 seconds
 * });
 * ```
 */
export function createNextApiHealthCheckHandler<Ctx = void>(
  options: NextApiMedicusOptions<Ctx>
): NextApiHealthCheckHandler;
export function createNextApiHealthCheckHandler<Ctx = void>(
  medicus: Medicus<Ctx>,
  options?: NextApiHealthCheckOptions
): NextApiHealthCheckHandler;
export function createNextApiHealthCheckHandler<Ctx = void>(
  medicusOrOptions: Medicus<Ctx> | NextApiMedicusOptions<Ctx>,
  options?: NextApiHealthCheckOptions
): NextApiHealthCheckHandler {
  // Determine if first argument is a Medicus instance or options
  const isMedicusInstance = medicusOrOptions instanceof Medicus;

  let medicus: Medicus<Ctx>;
  let debugDetector: DebugDetector;

  if (isMedicusInstance) {
    // First param is a Medicus instance
    medicus = medicusOrOptions;
    debugDetector = options?.debug ?? false;
  } else {
    // First param is options, extract debug and create Medicus
    const { debug, ...medicusOptions } = medicusOrOptions;
    medicus = new Medicus(medicusOptions);
    debugDetector = debug ?? false;
  }

  return async function nextApiHealthCheckHandler(req, res) {
    // Parse query parameters
    const query = req.query;
    const last = !!query.last;
    const queryDebug = !!query.debug;

    // Determine debug mode: query param takes precedence, then debugDetector
    const isDebug =
      queryDebug || (typeof debugDetector === 'boolean' ? debugDetector : await debugDetector(req));

    const simulate = parseHealthStatus(
      typeof query.simulate === 'string' ? query.simulate : undefined
    );

    // Perform health check
    const check = await performHttpCheck(medicus, isDebug, last, simulate);

    // Set headers
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    // Send response
    res.status(check.status).json(check.result);
  };
}
