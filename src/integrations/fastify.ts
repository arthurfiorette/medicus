import { Type } from '@sinclair/typebox';
import type { FastifyInstance, FastifyRequest, RouteOptions } from 'fastify';
import fp from 'fastify-plugin';
import { Medicus } from '../medicus';
import { AllSchemas, HealthCheckQueryParamsSchema, HealthCheckResultSchema } from '../schemas';
import { type HealthCheckResult, HealthStatus, type MedicusOption } from '../types';
import { HttpStatuses, healthStatusToHttpStatus } from '../utils/http';

declare module 'fastify' {
  interface FastifyInstance {
    /**
     * The medicus instance that can be used to perform health checks
     */
    medicus: Medicus<FastifyInstance>;
  }
}

/**
 * A detector function that can be used to determine if the debug output should be shown
 */
export type DebugDetector = boolean | ((req: FastifyRequest) => boolean | Promise<boolean>);

export type FastifyMedicsPluginOptions = Omit<
  MedicusOption<FastifyInstance>,
  'manualClearBackgroundCheck' | 'context'
> & {
  /**
   * If the health check route should be hidden from the documentation
   *
   * @default false
   */
  hide?: boolean;

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

export const medicusPlugin = fp<FastifyMedicsPluginOptions>(
  async (fastify, { route, debug = false, hide, ...medicusOptions }) => {
    fastify.decorate(
      'medicus',
      new Medicus({
        context: fastify,
        ...medicusOptions,
        // better to close on fastify close
        manualClearBackgroundCheck: true
      })
    );

    // @fastify/under-pressure plugin support
    if (fastify.hasPlugin('@fastify/under-pressure')) {
      fastify.medicus.addChecker({
        async pressure() {
          return {
            status: fastify.isUnderPressure() ? HealthStatus.DEGRADED : HealthStatus.HEALTHY,
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
        hide,
        tags: ['Health'],
        description: 'Performs a health check on the system',
        response: Object.fromEntries(
          HttpStatuses.map((status) => [status, Type.Ref(HealthCheckResultSchema)])
        ),
        querystring: Type.Ref(HealthCheckQueryParamsSchema),
        ...route?.schema
      },
      async handler(request, reply): Promise<HealthCheckResult> {
        let result: HealthCheckResult | null = null;

        //@ts-expect-error - untyped from querystring
        if (request.query.last) {
          result = this.medicus.getLastCheck();
        }

        if (!result) {
          result = await this.medicus.performCheck();
        }

        reply.status(healthStatusToHttpStatus(result.status));

        return {
          status: result.status,
          services: (typeof debug === 'boolean' ? debug : await debug(request))
            ? result.services
            : {}
        };
      }
    });

    if (medicusOptions.backgroundCheckInterval) {
      fastify.addHook('onClose', async function () {
        this.medicus.closeBackgroundCheck();
      });
    }
  },
  {
    fastify: '5.x',
    name: 'medicus/fastify'
  }
);
