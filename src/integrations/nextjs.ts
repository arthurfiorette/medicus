import type { IncomingMessage, ServerResponse } from 'node:http';
import { Medicus } from '../medicus';
import type { MedicusOption } from '../types';
import {
  createHealthCheckHeaders,
  parseHealthStatus,
  parseQueryFlag,
  performHttpCheck
} from '../utils/http';

export interface NextHealthCheckOptions<Req> {
  /**
   * Whether to include debug information in the response by default. A function
   * decides per request (for example, only for authenticated callers) and the
   * `?debug` query parameter is ignored.
   *
   * @default false
   */
  debug?: boolean | ((req: Req) => boolean | Promise<boolean>);

  /**
   * Custom response headers to include in health check responses
   *
   * @default DefaultHealthCheckHeaders
   */
  headers?: Record<string, string>;
}

export type NextMedicusOptions<Req> = Omit<MedicusOption<Req>, 'context'> &
  NextHealthCheckOptions<Req>;

export interface NextHealthCheckHandler<Req extends Request = Request> {
  (this: void, req: Req): Promise<Response>;

  /** The underlying Medicus instance, useful to register checkers later or to stop background checks */
  medicus: Medicus<Req>;
}

export interface NextPagesHealthCheckHandler<Req extends IncomingMessage = IncomingMessage> {
  (this: void, req: Req, res: ServerResponse): Promise<void>;

  /** The underlying Medicus instance, useful to register checkers later or to stop background checks */
  medicus: Medicus<Req>;
}

/**
 * Creates a Next.js App Router route handler for a health check endpoint.
 *
 * Checkers receive the incoming request as their context. Pass `NextRequest` as the
 * type parameter to type it as such.
 *
 * @example
 * ```ts
 * // app/health/route.ts
 * export const GET = createNextHealthCheckHandler({
 *   checkers: { database: () => HealthStatus.HEALTHY }
 * });
 * ```
 */
export function createNextHealthCheckHandler<Req extends Request = Request>({
  debug,
  headers,
  ...medicusOptions
}: NextMedicusOptions<Req> = {}): NextHealthCheckHandler<Req> {
  const defaultHeaders = createHealthCheckHeaders(headers);
  const medicus = new Medicus<Req>(medicusOptions);

  const handler = async function nextHealthCheckHandler(req: Req) {
    const { searchParams } = new URL(req.url);

    const last = parseQueryFlag(searchParams.get('last'));
    const isDebug = await resolveDebug(debug, req, searchParams.get('debug'));
    const simulate = parseHealthStatus(searchParams.get('simulate'));

    const check = await performHttpCheck(medicus, isDebug, last, simulate, req);
    return new Response(JSON.stringify(check.result), {
      status: check.status,
      headers: defaultHeaders
    });
  } as NextHealthCheckHandler<Req>;

  handler.medicus = medicus;
  return handler;
}

/**
 * Creates a Next.js Pages Router API route handler for a health check endpoint.
 *
 * Checkers receive the incoming request as their context. Pass `NextApiRequest` as the
 * type parameter to type it as such.
 *
 * @example
 * ```ts
 * // pages/api/health.ts
 * export default createNextPagesHealthCheckHandler({
 *   checkers: { database: () => HealthStatus.HEALTHY }
 * });
 * ```
 */
export function createNextPagesHealthCheckHandler<Req extends IncomingMessage = IncomingMessage>({
  debug,
  headers,
  ...medicusOptions
}: NextMedicusOptions<Req> = {}): NextPagesHealthCheckHandler<Req> {
  const defaultHeaders = createHealthCheckHeaders(headers);
  const medicus = new Medicus<Req>(medicusOptions);

  const handler = async function nextPagesHealthCheckHandler(req: Req, res: ServerResponse) {
    const { searchParams } = new URL(req.url ?? '/', 'http://localhost');

    const last = parseQueryFlag(searchParams.get('last'));
    const isDebug = await resolveDebug(debug, req, searchParams.get('debug'));
    const simulate = parseHealthStatus(searchParams.get('simulate'));

    const check = await performHttpCheck(medicus, isDebug, last, simulate, req);
    res.writeHead(check.status, defaultHeaders).end(JSON.stringify(check.result));
  } as NextPagesHealthCheckHandler<Req>;

  handler.medicus = medicus;
  return handler;
}

function resolveDebug<Req>(
  debug: NextHealthCheckOptions<Req>['debug'],
  req: Req,
  queryDebug: string | null
): boolean | Promise<boolean> {
  // A detector must not be bypassable with `?debug=true`
  if (typeof debug === 'function') {
    return debug(req);
  }

  return !!debug || parseQueryFlag(queryDebug);
}
