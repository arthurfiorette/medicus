import type { H3Event } from 'h3';
import { Medicus } from '../medicus';
import type { MedicusOption } from '../types';
import { createHealthCheckHeaders, parseHealthStatus, performHttpCheck } from '../utils/http';

export interface H3HealthCheckOptions {
  /** Whether to include debug information in the response by default */
  debug?: boolean;

  /**
   * Custom response headers
   *
   * @default DefaultHealthCheckHeaders
   */
  headers?: Record<string, string>;
}

export type H3MedicusOptions = Omit<MedicusOption<H3Event>, 'context'> & H3HealthCheckOptions;

export interface H3HealthCheckHandler {
  (this: void, event: H3Event): Promise<Response>;

  /** The underlying Medicus instance, useful for registration and shutdown */
  medicus: Medicus<H3Event>;
}

/**
 * Creates an H3 event handler that can also be exported directly from a Nitro route.
 *
 * The handler returns a Web Response, which is supported by H3 1/Nitro 2 and is
 * the native response model in H3 2/Nitro 3.
 */
export function createH3HealthCheckHandler({
  debug,
  headers,
  ...medicusOptions
}: H3MedicusOptions = {}): H3HealthCheckHandler {
  const defaultDebug = !!debug;
  const defaultHeaders = createHealthCheckHeaders(headers);
  const medicus = new Medicus<H3Event>(medicusOptions);

  const handler = async function h3HealthCheckHandler(event: H3Event): Promise<Response> {
    const url = getEventUrl(event);
    const last = url.searchParams.has('last');
    const isDebug = url.searchParams.has('debug') || defaultDebug;
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

function getEventUrl(event: H3Event): URL {
  // H3 2 exposes `event.url`; H3 1 and stable Nitro expose `event.node.req.url`.
  const modernEvent = event as H3Event & { url?: URL };
  if (modernEvent.url) {
    return modernEvent.url;
  }

  return new URL(event.node.req.url || '/', 'http://localhost');
}
