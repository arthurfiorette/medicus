import type { ServerResponse } from 'node:http';
import type { Medicus } from '../medicus';
import { parseHealthStatus, performHttpCheck } from '../utils/http';

export interface HttpHealthCheckOptions {
  /**
   * Whether to include debug information in the response by default
   *
   * @default false
   */
  debug?: boolean;

  /**
   * Custom response headers to include in health check responses
   *
   * @default { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-cache, no-store, must-revalidate' }
   */
  headers?: Record<string, string>;
}

/**
 * HTTP health check handler function type.
 *
 * Takes URL search parameters and a server response object, and handles the complete
 * health check request/response cycle including query parameter parsing, health check
 * execution, and response formatting.
 *
 * @param searchParams - URL search parameters containing optional `debug`, `last`, and `simulate` parameters
 * @param res - Node.js ServerResponse object to write the health check result to
 * @returns Promise that resolves when the response has been written (never rejects)
 *
 * @example
 * ```ts
 * const handler = createHttpHealthCheckHandler(medicus);
 *
 * // Usage in HTTP server
 * const server = createServer((req, res) => {
 *   const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
 *   await handler(url.searchParams, res);
 * });
 * ```
 */
export type HttpHealthCheckHandler = (
  this: void,
  searchParams: URLSearchParams,
  res: ServerResponse
) => Promise<void>;

/**
 * Creates a complete HTTP health check request handler that parses query parameters
 * and handles the full request/response cycle.
 *
 * This handler supports the same query parameters as the Fastify integration:
 * - `?debug=true` - Include debug information in response
 * - `?last=true` - Return the last cached health check result
 * - `?simulate=healthy|degraded|unhealthy` - Simulate a specific health status
 *
 * @example
 * ```ts
 * import { createServer } from 'node:http';
 * import { Medicus } from 'medicus';
 * import { createHttpHealthCheckHandler } from 'medicus/integrations/http';
 *
 * const medicus = new Medicus({
 *   checkers: {
 *     database: () => HealthStatus.HEALTHY
 *   }
 * });
 *
 * const handleHealthCheck = createHttpHealthCheckHandler(medicus);
 *
 * const server = createServer((req, res) => {
 *   if (req.url?.startsWith('/health')) {
 *     const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
 *     return handleHealthCheck(url.searchParams, res);
 *   }
 *   // Handle other routes...
 * });
 * ```
 */
export function createHttpHealthCheckHandler<Ctx = void>(
  medicus: Medicus<Ctx>,
  options: HttpHealthCheckOptions = {}
): HttpHealthCheckHandler {
  const defaultDebug = !!options.debug || false;
  const defaultHeaders = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-cache, no-store, must-revalidate',
    ...options.headers
  };

  return async function httpHealthCheckHandler(searchParams, res) {
    const last = !!searchParams.get('last');
    const debug = !!searchParams.get('debug') || defaultDebug;
    const simulate = parseHealthStatus(searchParams.get('simulate'));

    const check = await performHttpCheck(medicus, debug, last, simulate);
    res.writeHead(check.status, defaultHeaders).end(JSON.stringify(check.result));
  };
}
