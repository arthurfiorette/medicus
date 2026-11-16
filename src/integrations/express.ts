import type { Request, RequestHandler } from 'express';
import { Medicus } from '../medicus';
import type { MedicusOption } from '../types';
import {
  createHealthCheckHeaders,
  parseHealthStatus,
  parseQueryFlag,
  performHttpCheck
} from '../utils/http';

export interface ExpressHealthCheckOptions {
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

export type ExpressMedicusOptions = Omit<MedicusOption<Request>, 'context'> &
  ExpressHealthCheckOptions;

export interface ExpressHealthCheckHandler extends RequestHandler {
  /** The underlying Medicus instance, useful to register checkers later or to stop background checks */
  medicus: Medicus<Request>;
}

/**
 * Creates an Express route handler for a health check endpoint.
 *
 * Checkers receive the current Express `Request` as their context.
 *
 * @example
 * ```ts
 * app.get('/health', createExpressHealthCheckHandler({
 *   checkers: { database: () => HealthStatus.HEALTHY }
 * }));
 * ```
 */
export function createExpressHealthCheckHandler({
  debug,
  headers,
  ...medicusOptions
}: ExpressMedicusOptions = {}): ExpressHealthCheckHandler {
  const defaultDebug = !!debug;
  const defaultHeaders = createHealthCheckHeaders(headers);
  const medicus = new Medicus<Request>(medicusOptions);

  const handler: ExpressHealthCheckHandler = async function expressHealthCheckHandler(
    req,
    res,
    next
  ) {
    try {
      const last = parseQueryFlag(req.query.last);
      const isDebug = parseQueryFlag(req.query.debug) || defaultDebug;
      const simulate = parseHealthStatus(
        typeof req.query.simulate === 'string' ? req.query.simulate : undefined
      );

      const check = await performHttpCheck(medicus, isDebug, last, simulate, req);
      res.set(defaultHeaders).status(check.status).json(check.result);
    } catch (error) {
      // Express 4 does not forward rejected handler promises
      next(error);
    }
  };

  handler.medicus = medicus;
  return handler;
}
