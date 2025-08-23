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
): (searchParams: URLSearchParams, res: ServerResponse) => void {
  options.debug ??= false;
  options.headers ??= {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-cache, no-store, must-revalidate'
  };

  return (searchParams: URLSearchParams, res: ServerResponse): void => {
    const last = !!searchParams.get('last');
    const debug = !!searchParams.get('debug') || !!options.debug;
    const simulate = parseHealthStatus(searchParams.get('simulate'));

    // Since performHttpCheck never throws, we can safely ignore errors here
    void performHttpCheck(medicus, debug, last, simulate).then((check) => {
      res.writeHead(check.status, options.headers).end(JSON.stringify(check.result));
    });
  };
}
