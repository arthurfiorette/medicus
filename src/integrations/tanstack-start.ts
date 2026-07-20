import { Medicus } from '../medicus';
import type { HealthCheckResult, HealthStatus, MedicusOption } from '../types';
import { parseHealthStatus, performHttpCheck } from '../utils/http';

/**
 * Input data accepted by the TanStack Start health check handler.
 *
 * Pass it through a server function validator so callers can toggle
 * these flags: `getHealth({ data: { debug: true } })`.
 */
export interface TanStackStartHealthCheckInput {
  /**
   * Whether to include debug information in the result
   *
   * @default false
   */
  debug?: boolean;

  /**
   * Whether to return the last cached health check result instead of
   * performing a new check
   *
   * @default false
   */
  last?: boolean;

  /**
   * Simulates the health check result with the provided status
   */
  simulate?: HealthStatus | (string & {});
}

/**
 * Structural subset of the context object TanStack Start passes to
 * `createServerFn().handler()`.
 *
 * Kept structural on purpose: medicus does not depend on
 * `@tanstack/react-start` or `@tanstack/solid-start`, and any object shape
 * TanStack passes remains assignable to this type.
 */
export interface TanStackStartServerFnCtx {
  /** Validated input data forwarded by TanStack Start (`fn({ data })`) */
  // `| undefined` is required so ctx types remain assignable under `exactOptionalPropertyTypes`.
  // Only `data` is declared because it is the only property this handler reads —
  // a minimal contravariant param keeps the handler assignable across TanStack versions.
  // Note: checkers already receive a timeout AbortSignal from Medicus as their second argument.
  data?: TanStackStartHealthCheckInput | undefined;
}

export interface TanStackStartHealthCheckOptions {
  /**
   * Whether to include debug information in the result by default
   *
   * @default false
   */
  debug?: boolean;
}

export type TanStackStartMedicusOptions<
  Ctx extends TanStackStartServerFnCtx = TanStackStartServerFnCtx
> = Omit<MedicusOption<Ctx>, 'context'> & TanStackStartHealthCheckOptions;

export interface TanStackStartHealthCheckHandler<
  Ctx extends TanStackStartServerFnCtx = TanStackStartServerFnCtx
> {
  (this: void, ctx?: Ctx): Promise<HealthCheckResult>;

  /**
   * The underlying `Medicus` instance, useful to register checkers later or
   * to stop background checks on shutdown
   */
  medicus: Medicus<Ctx>;
}

/**
 * Creates a health check handler for TanStack Start server functions.
 *
 * Server functions are RPC endpoints, so instead of writing an HTTP response
 * this handler returns the {@linkcode HealthCheckResult} directly and lets
 * TanStack Start serialize it across the network boundary.
 *
 * Supported input flags (see {@linkcode TanStackStartHealthCheckInput}):
 * - `debug: true` - Include debug information in the result
 * - `last: true` - Return the last cached health check result
 * - `simulate: 'healthy' | 'degraded' | 'unhealthy'` - Simulate a specific health status
 *
 * Notes:
 * - Checkers receive the server function context (`{ data, context, ... }`) as the Medicus context.
 * - The base Medicus context is `null`; the server function context is provided per call.
 * - `backgroundCheckInterval` is only suitable for long-lived Node.js deployments;
 *   keep it disabled on serverless/edge targets.
 *
 * @example
 * ```ts
 * import { createServerFn } from '@tanstack/react-start';
 * import { HealthStatus } from 'medicus';
 * import {
 *   createTanStackStartHealthCheckHandler,
 *   type TanStackStartHealthCheckInput
 * } from 'medicus/tanstack-start';
 *
 * export const getHealth = createServerFn({ method: 'GET' })
 *   .validator((data?: TanStackStartHealthCheckInput) => data)
 *   .handler(
 *     createTanStackStartHealthCheckHandler({
 *       checkers: {
 *         database: () => HealthStatus.HEALTHY
 *       }
 *     })
 *   );
 *
 * // from a loader, component or another server function
 * const result = await getHealth({ data: { debug: true } });
 * ```
 */
export function createTanStackStartHealthCheckHandler<
  Ctx extends TanStackStartServerFnCtx = TanStackStartServerFnCtx
>({
  debug,
  ...medicusOptions
}: TanStackStartMedicusOptions<Ctx> = {}): TanStackStartHealthCheckHandler<Ctx> {
  const defaultDebug = !!debug;
  const medicus = new Medicus<Ctx>(medicusOptions);

  const handler = async function tanStackStartHealthCheckHandler(
    ctx?: Ctx
  ): Promise<HealthCheckResult> {
    const input = ctx?.data;

    const last = !!input?.last;
    const isDebug = !!input?.debug || defaultDebug;
    // simulate crosses the network boundary, so it is re-validated here even
    // when a server function validator is in place
    const simulate = parseHealthStatus(
      typeof input?.simulate === 'string' ? input.simulate : undefined
    );

    const check = await performHttpCheck(medicus, isDebug, last, simulate, ctx);
    return check.result;
  };

  handler.medicus = medicus;

  return handler;
}
