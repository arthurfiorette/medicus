import { Type } from '@sinclair/typebox';
import type { FastifyInstance, FastifyRequest, RouteOptions } from 'fastify';
import fp from 'fastify-plugin';
import { Medicus } from '../medicus';
import { AllSchemas, HealthCheckQueryParamsSchema, HealthCheckResultSchema } from '../schemas';
import { type HealthCheckResult, HealthStatus, type MedicusOption } from '../types';
import { HttpStatuses, healthStatusToHttpStatus } from '../utils/http';
import { pinoMedicusPlugin } from './pino';

declare module 'fastify' {
  interface FastifyInstance {
    /** The medicus instance that can be used to perform health checks */
    medicus: Medicus<FastifyInstance>;
  }
}

/** A detector function that can be used to determine if the debug output should be shown */
export type DebugDetector = boolean | ((req: FastifyRequest) => boolean | Promise<boolean>);

export type FastifyMedicsPluginOptions = Omit<
  MedicusOption<FastifyInstance>,
  'manualClearBackgroundCheck' | 'context' | 'errorLogger'
> & {
  /**
   * The route options to be passed to fastify
   *
   * @default { url: '/health', method: 'GET', logLevel: 'silent' }
   */
  route?: Partial<Omit<RouteOptions, 'handler'>>;

  /**
   * Whether to reply with a complete health check result or just the status
   *
   * @default false
   */
  debug?: DebugDetector;

  /**
   * The name of the pressure checker to use when @fastify/under-pressure is used
   *
   * @default 'pressure'
   */
  pressureCheckerName?: string;
};

/**
 * A fastify plugin that registers a health check route and a medicus instance
 *
 * @example
 *
 * ```ts
 * app.register(fastifyMedicusPlugin, {
 *   checkers: {
 *     db() {
 *       return true;
 *     }
 *   }
 * });
 * ```
 */
export const fastifyMedicusPlugin = fp<FastifyMedicsPluginOptions>(
  async (
    fastify,
    { route, debug = false, pressureCheckerName = 'pressure', ...medicusOptions }
  ) => {
    // Adds fastify error logger
    medicusOptions.plugins ??= [];
    medicusOptions.plugins.push(pinoMedicusPlugin(fastify.log));

    fastify.decorate(
      'medicus',
      new Medicus({
        ...medicusOptions,
        // auto inject context
        context: fastify
      })
    );

    // @fastify/under-pressure plugin support
    if (fastify.hasPlugin('@fastify/under-pressure')) {
      fastify.medicus.addChecker({
        async [pressureCheckerName]() {
          return {
            //@ts-ignore - only if @fastify/under-pressure is used
            status: fastify.isUnderPressure() ? HealthStatus.DEGRADED : HealthStatus.HEALTHY,
            //@ts-ignore - only if @fastify/under-pressure is used
            debug: fastify.memoryUsage()
          };
        }
      });
    }

    fastify.route({
      url: '/health',
      method: 'GET',
      // disable logging for health check$
      logLevel: 'silent',
      ...route,
      schema: {
        tags: ['Health'],
        description: 'Performs a health check on the system',
        response: Object.fromEntries(
          HttpStatuses.map((status) => [status, HealthCheckResultSchema])
        ),
        querystring: HealthCheckQueryParamsSchema,
        ...route?.schema
      },
      async handler(request, reply): Promise<HealthCheckResult> {
        let result: HealthCheckResult | null = null;

        const isDebug = typeof debug === 'boolean' ? debug : await debug(request);

        //@ts-expect-error - untyped from querystring
        if (request.query.last) {
          result = this.medicus.getLastCheck(isDebug);
        }

        if (!result) {
          result = await this.medicus.performCheck(isDebug);
        }

        //@ts-expect-error - untyped from querystring
        if (request.query.simulate) result.status = request.query.simulate;

        reply.status(healthStatusToHttpStatus(result.status));

        return result;
      }
    });

    // Clears the background check on close
    fastify.addHook('onClose', function (_, done) {
      this.medicus.stopBackgroundCheck();
      return done();
    });
  },
  {
    fastify: '5.x',
    name: 'medicus/fastify'
  }
);
