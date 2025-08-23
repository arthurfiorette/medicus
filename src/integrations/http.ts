import type { IncomingMessage, ServerResponse } from 'node:http';
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
   * @default { 'Content-Type': 'application/json; charset=utf-8' }
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
 *     return handleHealthCheck(req, res);
 *   }
 *   // Handle other routes...
 * });
 * ```
 *
 * @example With Avvio
 * ```ts
 * import avvio from 'avvio';
 * import { createServer } from 'node:http';
 * import { avvioMedicusPlugin } from 'medicus/integrations/avvio';
 * import { createHttpHealthCheckHandler } from 'medicus/integrations/http';
 *
 * type Context = {
 *   medicus: AvvioMedicus<Context>;
 * };
 *
 * const app = avvio({} as Context);
 * app.use(avvioMedicusPlugin({}));
 *
 * app.ready(() => {
 *   const handleHealthCheck = createHttpHealthCheckHandler(app.medicus);
 *
 *   const server = createServer((req, res) => {
 *     if (req.url?.startsWith('/health')) {
 *       return handleHealthCheck(req, res);
 *     }
 *     // Other routes...
 *   });
 * });
 * ```
 */
export function createHttpHealthCheckHandler<Ctx = void>(
  medicus: Medicus<Ctx>,
  options: HttpHealthCheckOptions = {}
): (req: IncomingMessage, res: ServerResponse) => void {
  options.debug ??= false;
  options.headers ??= { 'content-type': 'application/json; charset=utf-8' };

  return (req: IncomingMessage, res: ServerResponse): void => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);

    const last = !!url.searchParams.get('last');
    const debug = !!url.searchParams.get('debug') || !!options.debug;
    const simulate = parseHealthStatus(url.searchParams.get('simulate'));

    // Since performHttpCheck never throws, we can safely ignore errors here
    void performHttpCheck(medicus, debug, last, simulate).then((check) => {
      res.writeHead(check.status, options.headers).end(JSON.stringify(check.result));
    });
  };
}
