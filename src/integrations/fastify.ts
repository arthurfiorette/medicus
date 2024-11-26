import { Type } from '@sinclair/typebox';
import type { FastifyInstance, FastifyRequest, RouteOptions } from 'fastify';
import fp from 'fastify-plugin';
import { Medicus } from '../medicus';
import { AllSchemas, HealthCheckQueryParamsSchema, HealthCheckResultSchema } from '../schemas';
import { type HealthCheckResult, HealthStatus, type MedicusOption } from '../types';
import { pinoToErrorLogger } from '../utils';
import { HttpStatuses, healthStatusToHttpStatus } from '../utils/http';

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
};

/**
 * A fastify plugin that registers a health check route and a medicus instance
 *
 * @example
 *
 * ```ts
 * app.register(medicusPlugin, {
 *   checkers: {
 *     db() {
 *       return true;
 *     }
 *   }
 * });
 * ```
 */
export const medicusPlugin = fp<FastifyMedicsPluginOptions>(
  async (fastify, { route, debug = false, ...medicusOptions }) => {
    fastify.decorate(
      'medicus',
      new Medicus({
        ...medicusOptions,
        // auto inject context
        context: fastify,
        // logs to fastify logger
        errorLogger: pinoToErrorLogger(fastify.log)
      })
    );

    // @fastify/under-pressure plugin support
    if (fastify.hasPlugin('@fastify/under-pressure')) {
      fastify.medicus.addChecker({
        async pressure() {
          return {
            //@ts-ignore - only if @fastify/under-pressure is used
            status: fastify.isUnderPressure() ? HealthStatus.DEGRADED : HealthStatus.HEALTHY,
            //@ts-ignore - only if @fastify/under-pressure is used
            debug: fastify.memoryUsage()
          };
        }
      });
    }

    for (const schema of AllSchemas) {
      fastify.addSchema(schema);
    }

    fastify.route({
      url: '/health',
      method: 'GET',
      // disable logging for health check
      logLevel: 'silent',
      ...route,
      schema: {
        tags: ['Health'],
        description: 'Performs a health check on the system',
        response: Object.fromEntries(
          HttpStatuses.map((status) => [status, Type.Ref(HealthCheckResultSchema.$id!)])
        ),
        querystring: Type.Ref(HealthCheckQueryParamsSchema.$id!),
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

    if (medicusOptions.backgroundCheckInterval) {
      fastify.addHook('onClose', async function () {
        this.medicus.stopBackgroundCheck();
      });
    }
  },
  {
    fastify: '5.x',
    name: 'medicus/fastify'
  }
);
