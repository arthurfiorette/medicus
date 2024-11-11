import { Type } from '@sinclair/typebox';
import { HealthStatus } from './types';

export const HealthStatusSchema = Type.Enum(HealthStatus, {
  $id: 'MedicusHealthStatus'
});

export const DetailedHealthCheckSchema = Type.Object(
  {
    status: HealthStatusSchema,
    info: Type.Optional(Type.String()),
    debug: Type.Optional(
      Type.Object({
        key: Type.Union([Type.Number(), Type.Boolean(), Type.String()])
      })
    )
  },
  {
    $id: 'MedicusDetailedHealthCheck',
    additionalProperties: false
  }
);

export const HealthCheckComplexResultSchema = Type.Object(
  {
    status: HealthStatusSchema,
    services: Type.Record(Type.String(), Type.Ref(DetailedHealthCheckSchema))
  },
  {
    $id: 'MedicusHealthCheckResult',
    additionalProperties: false
  }
);

export const HealthCheckSimpleResultSchema = Type.Pick(HealthCheckComplexResultSchema, ['status'], {
  $id: 'MedicusHealthCheckSimpleResult',
  additionalProperties: false
});

export const HealthCheckResultSchema = Type.Union(
  [HealthCheckSimpleResultSchema, HealthCheckComplexResultSchema],
  {
    $id: 'MedicusHealthCheckResult',
    additionalProperties: false
  }
);

export const HealthCheckQueryParamsSchema = Type.Object(
  {
    last: Type.Optional(
      Type.Boolean({
        description: 'If set to true, the last health check result will be returned',
        default: false
      })
    )
  },
  {
    $id: 'MedicusHealthCheckQueryParams',
    additionalProperties: false
  }
);

/**
 * An array containing all schemas to be easily added to a JSON schema validator
 */
export const AllSchemas = [
  DetailedHealthCheckSchema,
  HealthCheckComplexResultSchema,
  HealthCheckQueryParamsSchema,
  HealthCheckResultSchema,
  HealthCheckSimpleResultSchema,
  HealthStatusSchema
];
