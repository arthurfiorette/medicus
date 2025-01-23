import { SpanKind, SpanStatusCode, context, trace } from '@opentelemetry/api';
import { definePlugin } from '../plugins';
import { HealthStatus } from '../types';
import { PKG_NAME, PKG_VERSION } from '../utils/constants';

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

/**
 * A plugin that integrates OpenTelemetry tracing into the Medicus system
 *
 * This plugin instruments key Medicus methods to generate OpenTelemetry spans,
 * providing detailed tracing for health checks and background checks
 */
export const openTelemetryMedicusPlugin = definePlugin<boolean>((onlyTraceErrors = true) => ({
  created(medicus) {
    const tracer = trace.getTracer(PKG_NAME, PKG_VERSION);

    if (medicus.onBackgroundCheck) {
      const old = medicus.onBackgroundCheck;
      medicus.onBackgroundCheck = function otelOnBackgroundCheck(result) {
        if (onlyTraceErrors && result.status === HealthStatus.HEALTHY) {
          return old.call(undefined, result);
        }

        const span = tracer.startSpan('medicus.onBackgroundCheck', undefined, context.active());
        try {
          return context.with(trace.setSpan(context.active(), span), old, undefined, result);
        } finally {
          span.end();
        }
      };
    }

    const oldPerformCheck = medicus.performCheck;
    medicus.performCheck = async function otelPerformCheck(debug?: boolean) {
      const result = await oldPerformCheck.call(this, debug);
      if (onlyTraceErrors && result.status === HealthStatus.HEALTHY) {
        return result;
      }

      const span = tracer.startSpan(
        'medicus.performCheck',
        { attributes: { [MedicusAttributesNames.DEBUG]: !!debug } },
        context.active()
      );

      try {
        return context.with(trace.setSpan(context.active(), span), oldPerformCheck, this, debug);
      } catch (error: any) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message
        });

        span.recordException(error);

        throw error;
      } finally {
        span.end();
      }
    };

    //@ts-expect-error - protected property
    const oldExecuteChecker = medicus.executeChecker;
    //@ts-expect-error - protected property
    medicus.executeChecker = async function otelExecuteChecker(args) {
      const result = await oldExecuteChecker.call(this, args);

      if (onlyTraceErrors && result[1].status === HealthStatus.HEALTHY) {
        return result;
      }

      const span = tracer.startSpan(
        `medicus.checker:${args[0]}`,
        { attributes: { [MedicusAttributesNames.CHECKER_NAME]: args[0] }, kind: SpanKind.PRODUCER },
        context.active()
      );

      try {
        // this function never throws
        const result = await context.with(
          trace.setSpan(context.active(), span),
          oldExecuteChecker,
          this,
          args
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
        if (typeof result[1].debug?.error === 'string' || result[1].debug?.error instanceof Error) {
          span.recordException(result[1].debug.error);
        }

        return result;
      } finally {
        span.end();
      }
    };

    //@ts-expect-error - protected property
    const oldPerformBackgroundCheck = medicus.performBackgroundCheck;
    //@ts-expect-error - protected property
    medicus.performBackgroundCheck = async function otelPerformBackgroundCheck() {
      const result = await medicus.performCheck.call(this);
      if (onlyTraceErrors && result.status === HealthStatus.HEALTHY) {
        return result;
      }

      const span = tracer.startSpan('medicus.performBackgroundCheck', undefined, context.active());

      try {
        return context.with(trace.setSpan(context.active(), span), oldPerformBackgroundCheck, this);
      } finally {
        span.end();
      }
    };
  }
}));
