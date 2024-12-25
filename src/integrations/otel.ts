import { SpanStatusCode, context, trace } from '@opentelemetry/api';
import {
  InstrumentationBase,
  InstrumentationNodeModuleDefinition
} from '@opentelemetry/instrumentation';
import {
  type DetailedHealthCheck,
  type HealthCheckResult,
  type HealthChecker,
  HealthStatus,
  type MedicusOption
} from '../types';
import { PKG_NAME, PKG_VERSION } from '../utils/constants';

type MedicusModule = typeof import('../index');

export enum AttributeNames {
  DEBUG = 'medicus.debug',
  CHECKER_NAME = 'medicus.checker_name',
  CHECKER_STATUS = 'medicus.checker_status'
}

export class MedicusInstrumentation extends InstrumentationBase {
  constructor() {
    super(PKG_NAME, PKG_VERSION, {});
  }

  protected override init() {
    return [
      new InstrumentationNodeModuleDefinition(
        PKG_NAME,
        [PKG_VERSION],
        this._onPatchMain,
        this._onUnpatchMain
      )
    ];
  }

  private _onPatchMain = (moduleExports: MedicusModule) => {
    const instrumentation = this;

    this._wrap(
      moduleExports,
      'Medicus',
      (Medicus) =>
        class OtelMedicus<Ctx> extends Medicus<Ctx> {
          constructor(options?: MedicusOption<Ctx>) {
            // wraps into its own span
            if (options?.onBackgroundCheck) {
              const old = options.onBackgroundCheck;

              options.onBackgroundCheck = function otelBackground(result) {
                const span = instrumentation.tracer.startSpan(
                  old.name || 'onBackgroundCheck',
                  undefined,
                  context.active()
                );

                try {
                  return context.with(
                    trace.setSpan(context.active(), span),
                    old,
                    undefined,
                    result
                  );
                } finally {
                  span.end();
                }
              };
            }

            super(options);
          }

          override async performCheck(debug?: boolean): Promise<HealthCheckResult> {
            if (!instrumentation.isEnabled()) {
              return super.performCheck.call(this, debug);
            }

            const span = instrumentation.tracer.startSpan(
              this.performCheck.name || 'performCheck',
              { attributes: { [AttributeNames.DEBUG]: !!debug } },
              context.active()
            );

            try {
              return await context.with(
                trace.setSpan(context.active(), span),
                super.performCheck,
                this,
                debug
              );
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
          }

          protected override async executeChecker(
            args: [string, HealthChecker<Ctx>]
          ): Promise<[string, DetailedHealthCheck]> {
            if (!instrumentation.isEnabled()) {
              return super.executeChecker.call(this, args);
            }

            const span = instrumentation.tracer.startSpan(
              args[0],
              {
                attributes: { [AttributeNames.CHECKER_NAME]: args[0] }
              },
              context.active()
            );

            try {
              // this function never throws
              const result = await context.with(
                trace.setSpan(context.active(), span),
                super.executeChecker,
                this,
                args
              );

              span.setAttributes({
                [AttributeNames.CHECKER_STATUS]: result[1].status,
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
              span.end();
            }
          }

          protected override performBackgroundCheck(): Promise<void> {
            if (!instrumentation.isEnabled()) {
              return super.performBackgroundCheck.call(this);
            }

            const span = instrumentation.tracer.startSpan(
              this.performBackgroundCheck.name || 'performBackgroundCheck',
              undefined,
              context.active()
            );

            try {
              return context.with(
                trace.setSpan(context.active(), span),
                super.performBackgroundCheck,
                this
              );
            } finally {
              span.end();
            }
          }
        }
    );
  };

  private _onUnpatchMain = (moduleExports: MedicusModule) => {
    this._unwrap(moduleExports, 'Medicus');
  };
}
