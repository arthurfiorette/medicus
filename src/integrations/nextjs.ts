import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Medicus } from '../medicus';
import type { MedicusOption } from '../types';
import { DefaultHttpHeaders, parseHealthStatus, performHttpCheck } from '../utils/http';

/** A detector function that can be used to determine if the debug output should be shown for Pages Router */
export type PagesDebugDetector = boolean | ((req: NextApiRequest) => boolean | Promise<boolean>);

/** A detector function that can be used to determine if the debug output should be shown for App Router */
export type AppDebugDetector = boolean | ((req: NextRequest) => boolean | Promise<boolean>);

export interface NextHealthCheckOptions {
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
   * { debug: (req) => req.headers.get('authorization') === 'Bearer secret' }
   * ```
   */
  debug?: AppDebugDetector | PagesDebugDetector;

  /**
   * Custom response headers to include in health check responses
   *
   * @default { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-cache, no-store, must-revalidate' }
   */
  headers?: Record<string, string>;
}

/**
 * Options for creating a Next.js health check handler.
 * Combines MedicusOption with NextHealthCheckOptions.
 */
export type NextMedicusOptions<Ctx = void> = MedicusOption<Ctx> & NextHealthCheckOptions;

/**
 * Creates a Next.js App Router route handler for health checks.
 *
 * This handler is designed for use with Next.js App Router (the default and recommended approach).
 * Supports query parameters:
 * - `?debug=true` - Include debug information in response
 * - `?last=true` - Return the last cached health check result
 * - `?simulate=healthy|degraded|unhealthy` - Simulate a specific health status
 *
 * @param options - Configuration options including checkers and debug settings
 * @returns A Next.js App Router GET handler function
 *
 * @example
 * ```ts
 * // app/api/health/route.ts
 * import { HealthStatus } from 'medicus';
 * import { createNextHealthCheckHandler } from 'medicus/nextjs';
 *
 * export const GET = createNextHealthCheckHandler({
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
 * export const GET = createNextHealthCheckHandler({
 *   checkers: {
 *     database: () => HealthStatus.HEALTHY
 *   },
 *   debug: (req) => req.headers.get('authorization') === 'Bearer secret-token'
 * });
 * ```
 */
export function createNextHealthCheckHandler<Ctx = void>(
  options: NextMedicusOptions<Ctx>
): (req: NextRequest) => Promise<NextResponse> {
  const { debug, headers, ...medicusOptions } = options;
  const medicus = new Medicus(medicusOptions);
  const debugDetector = debug ?? false;
  const defaultHeaders = {
    ...DefaultHttpHeaders,
    ...headers
  };

  return async function nextHealthCheckHandler(req: NextRequest) {
    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const last = !!searchParams.get('last');
    const queryDebug = !!searchParams.get('debug');

    // Determine debug mode: query param takes precedence, then debugDetector
    let isDebug = queryDebug;
    if (!isDebug && typeof debugDetector === 'function') {
      isDebug = await (debugDetector as (req: NextRequest) => boolean | Promise<boolean>)(req);
    } else if (!isDebug) {
      isDebug = debugDetector as boolean;
    }

    const simulate = parseHealthStatus(searchParams.get('simulate'));

    // Perform health check
    const check = await performHttpCheck(medicus, isDebug, last, simulate);

    // Return response
    return NextResponse.json(check.result, {
      status: check.status,
      headers: defaultHeaders
    });
  };
}

/**
 * Creates a Next.js Pages Router API route handler for health checks.
 *
 * This handler is for the legacy Pages Router. For new projects, use `createNextHealthCheckHandler` with App Router instead.
 * Supports query parameters:
 * - `?debug=true` - Include debug information in response
 * - `?last=true` - Return the last cached health check result
 * - `?simulate=healthy|degraded|unhealthy` - Simulate a specific health status
 *
 * @param options - Configuration options including checkers and debug settings
 * @returns A Next.js Pages Router API route handler function
 *
 * @example
 * ```ts
 * // pages/api/health.ts
 * import { HealthStatus } from 'medicus';
 * import { createNextPagesHealthCheckHandler } from 'medicus/nextjs';
 *
 * export default createNextPagesHealthCheckHandler({
 *   checkers: {
 *     database: () => HealthStatus.HEALTHY
 *   }
 * });
 * ```
 */
export function createNextPagesHealthCheckHandler<Ctx = void>(
  options: NextMedicusOptions<Ctx>
): (req: NextApiRequest, res: NextApiResponse) => Promise<void> {
  const { debug, headers, ...medicusOptions } = options;
  const medicus = new Medicus(medicusOptions);
  const debugDetector = debug ?? false;
  const defaultHeaders = {
    ...DefaultHttpHeaders,
    ...headers
  };

  return async function nextPagesHealthCheckHandler(req, res) {
    // Parse query parameters
    const query = req.query;
    const last = !!query.last;
    const queryDebug = !!query.debug;

    // Determine debug mode: query param takes precedence, then debugDetector
    let isDebug = queryDebug;
    if (!isDebug && typeof debugDetector === 'function') {
      isDebug = await (debugDetector as (req: NextApiRequest) => boolean | Promise<boolean>)(req);
    } else if (!isDebug) {
      isDebug = debugDetector as boolean;
    }

    const simulate = parseHealthStatus(
      typeof query.simulate === 'string' ? query.simulate : undefined
    );

    // Perform health check
    const check = await performHttpCheck(medicus, isDebug, last, simulate);

    // Set headers
    for (const [key, value] of Object.entries(defaultHeaders)) {
      res.setHeader(key, value);
    }

    // Send response
    res.status(check.status).json(check.result);
  };
}
