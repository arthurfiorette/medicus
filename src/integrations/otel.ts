import { SpanKind, SpanStatusCode, context, trace } from '@opentelemetry/api';

import { Medicus } from '../medicus';
import { definePlugin } from '../plugins';
import { HealthStatus } from '../types';
import { PKG_NAME, PKG_VERSION } from '../utils/constants';
import { patch } from '../utils/patch';

export enum MedicusAttributesNames {
  /**
   * Indicates whether debugging is enabled
   */
  DEBUG = 'medicus.debug',
  /**
   * The name of the health checker executed
   */
  CHECKER_NAME = 'medicus.checker_name',
  /**
   * The status of the health checker execution
   */
  CHECKER_STATUS = 'medicus.checker_status'
}

// just to make the methods public
declare class PublicMedicus<Ctx> extends Medicus<Ctx> {
  public executeChecker: Medicus<Ctx>['executeChecker'];
  public performBackgroundCheck: Medicus<Ctx>['performBackgroundCheck'];
}

/**
 * A plugin that integrates OpenTelemetry tracing into the Medicus system
 *
 * This plugin instruments key Medicus methods to generate OpenTelemetry spans,
 * providing detailed tracing for health checks and background checks
 */
export const openTelemetryMedicusPlugin = definePlugin<boolean>((onlyTraceErrors = true) => ({
  created(medicus) {
    const tracer = trace.getTracer(PKG_NAME, PKG_VERSION);

    patch(
      medicus,
      'onBackgroundCheck',
      (onBackgroundCheck) =>
        function otelOnBackgroundCheck(result) {
          const span = tracer.startSpan('medicus.onBackgroundCheck', undefined, context.active());
          try {
            return context.with(
              trace.setSpan(context.active(), span),
              onBackgroundCheck,
              undefined,
              result
            );
          } finally {
            span.end();
          }
        }
    );

    patch(
      medicus,
      'performCheck',
      (performCheck) =>
        async function otelPerformCheck(debug?: boolean) {
          let span: any;

          try {
            const result = await context.with(context.active(), performCheck, this, debug);

            if (result.status === HealthStatus.HEALTHY && onlyTraceErrors) {
              return result;
            }
            span = tracer.startSpan(
              'medicus.performCheck',
              { attributes: { [MedicusAttributesNames.DEBUG]: !!debug } },
              context.active()
            );

            return result;
          } catch (error: any) {
            const span = tracer.startSpan(
              'medicus.performCheck',
              { attributes: { [MedicusAttributesNames.DEBUG]: !!debug } },
              context.active()
            );

            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: error.message
            });

            span.recordException(error);

            throw error;
          } finally {
            span?.end();
          }
        }
    );

    patch(
      medicus as PublicMedicus<typeof medicus.context>,
      'executeChecker',
      (executeChecker) =>
        async function otelExecuteChecker(args) {
          let span: any;

          try {
            // this function never throws
            const result = await context.with(context.active(), executeChecker, this, args);

            if (result[1].status === HealthStatus.HEALTHY && onlyTraceErrors) {
              return result;
            }

            const spanName = `medicus.checker:${args[0]}`;

            span = tracer.startSpan(
              spanName,
              {
                attributes: { [MedicusAttributesNames.CHECKER_NAME]: args[0] },
                kind: SpanKind.PRODUCER
              },
              context.active()
            );

            span.setAttributes({
              [MedicusAttributesNames.CHECKER_STATUS]: result[1].status,
              ...result[1].debug
            });

            // Unhealthy should mark as error
            if (result[1].status !== HealthStatus.HEALTHY) {
              span.setStatus({ code: SpanStatusCode.ERROR });
            }

            // Attaches a possible exception to the span
            if (
              typeof result[1].debug?.error === 'string' ||
              result[1].debug?.error instanceof Error
            ) {
              span.recordException(result[1].debug.error);
            }

            return result;
          } finally {
            span?.end();
          }
        }
    );

    patch(
      medicus as PublicMedicus<typeof medicus.context>,
      'performBackgroundCheck',
      (performBackgroundCheck) =>
        async function otelPerformBackgroundCheck() {
          const span = tracer.startSpan(
            'medicus.performBackgroundCheck',
            undefined,
            context.active()
          );

          try {
            return context.with(
              trace.setSpan(context.active(), span),
              performBackgroundCheck,
              this
            );
          } finally {
            span.end();
          }
        }
    );
  }
}));