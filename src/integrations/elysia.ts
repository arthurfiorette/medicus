import type { Context } from 'elysia';
import { Medicus } from '../medicus';
import type { MedicusOption } from '../types';
import { createHealthCheckHeaders, parseHealthStatus, performHttpCheck } from '../utils/http';

export interface ElysiaHealthCheckOptions {
  /** Whether to include debug information in the response by default */
  debug?: boolean;

  /**
   * Custom response headers
   *
   * @default DefaultHealthCheckHeaders
   */
  headers?: Record<string, string>;
}

export type ElysiaMedicusOptions = Omit<MedicusOption<Context>, 'context'> &
  ElysiaHealthCheckOptions;

export interface ElysiaHealthCheckHandler {
  (this: void, context: Context): Promise<Response>;

  /** The underlying Medicus instance, useful for registration and shutdown */
  medicus: Medicus<Context>;
}

/**
 * Creates an Elysia route handler for a health check endpoint.
 *
 * @example
 * ```ts
 * app.get('/health', createElysiaHealthCheckHandler({
 *   checkers: { database: () => HealthStatus.HEALTHY }
 * }));
 * ```
 */
export function createElysiaHealthCheckHandler({
  debug,
  headers,
  ...medicusOptions
}: ElysiaMedicusOptions = {}): ElysiaHealthCheckHandler {
  const defaultDebug = !!debug;
  const defaultHeaders = createHealthCheckHeaders(headers);
  const medicus = new Medicus<Context>(medicusOptions);

  const handler = async function elysiaHealthCheckHandler(context: Context): Promise<Response> {
    const last = !!context.query.last;
    const isDebug = !!context.query.debug || defaultDebug;
    const simulate = parseHealthStatus(context.query.simulate);
    const check = await performHttpCheck(medicus, isDebug, last, simulate, context);

    return new Response(JSON.stringify(check.result), {
      status: check.status,
      headers: defaultHeaders
    });
  } as ElysiaHealthCheckHandler;

  handler.medicus = medicus;
  return handler;
}
