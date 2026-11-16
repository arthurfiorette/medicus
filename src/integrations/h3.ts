// h3 2 is ESM-only; types are erased, so CommonJS consumers never require it
import type { H3Event } from 'h3' with { 'resolution-mode': 'import' };
import { Medicus } from '../medicus';
import type { MedicusOption } from '../types';
import {
  createHealthCheckHeaders,
  parseHealthStatus,
  parseQueryFlag,
  performHttpCheck
} from '../utils/http';

export interface H3HealthCheckOptions {
  /**
   * Whether to include debug information in the response by default
   *
   * @default false
   */
  debug?: boolean;

  /**
   * Custom response headers to include in health check responses
   *
   * @default DefaultHealthCheckHeaders
   */
  headers?: Record<string, string>;
}

export type H3MedicusOptions = Omit<MedicusOption<H3Event>, 'context'> & H3HealthCheckOptions;

export interface H3HealthCheckHandler {
  (this: void, event: H3Event): Promise<Response>;

  /** The underlying Medicus instance, useful to register checkers later or to stop background checks */
  medicus: Medicus<H3Event>;
}

/**
 * Creates an H3 event handler for a health check endpoint. It can also be exported
 * directly from a Nitro route file.
 *
 * Checkers receive the current `H3Event` as their context. The handler returns a Web
 * `Response`, which H3 1 and H3 2 both accept from plain functions.
 *
 * @example
 * ```ts
 * // server/routes/health.get.ts
 * export default createH3HealthCheckHandler({
 *   checkers: { database: () => HealthStatus.HEALTHY }
 * });
 * ```
 */
export function createH3HealthCheckHandler({
  debug,
  headers,
  ...medicusOptions
}: H3MedicusOptions = {}): H3HealthCheckHandler {
  const defaultDebug = !!debug;
  const defaultHeaders = createHealthCheckHeaders(headers);
  const medicus = new Medicus<H3Event>(medicusOptions);

  const handler = async function h3HealthCheckHandler(event: H3Event) {
    // H3 2 parses `event.url`; H3 1 only exposes the path with its query string
    const url = (event.url as URL | undefined) ?? new URL(event.path, 'http://localhost');

    const last = parseQueryFlag(url.searchParams.get('last'));
    const isDebug = parseQueryFlag(url.searchParams.get('debug')) || defaultDebug;
    const simulate = parseHealthStatus(url.searchParams.get('simulate'));

    const check = await performHttpCheck(medicus, isDebug, last, simulate, event);
    return new Response(JSON.stringify(check.result), {
      status: check.status,
      headers: defaultHeaders
    });
  } as H3HealthCheckHandler;

  handler.medicus = medicus;
  return handler;
}
