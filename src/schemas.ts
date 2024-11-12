import { Type } from '@sinclair/typebox';
import { HealthStatus } from './types';

export const HealthStatusSchema = Type.Enum(HealthStatus, {
  $id: 'MedicusHealthStatus'
});

export const DetailedHealthCheckSchema = Type.Object(
  {
    status: Type.Ref(HealthStatusSchema),
    debug: Type.Optional(
      Type.Record(Type.String(), Type.Union([Type.Number(), Type.Boolean(), Type.String()]))
    )
  },
  {
    $id: 'MedicusDetailedHealthCheck',
    additionalProperties: false
  }
);

export const HealthCheckResultSchema = Type.Object(
  {
    status: Type.Ref(HealthStatusSchema),
    services: Type.Record(Type.String(), Type.Ref(DetailedHealthCheckSchema))
  },
  {
    $id: 'MedicusHealthCheckResult',
    additionalProperties: false
  }
);

export const HealthCheckQueryParamsSchema = Type.Object(
  {
    last: Type.Optional(
      Type.Boolean({
        description: 'If set to true, the last health check result will be returned'
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
  HealthCheckResultSchema,
  HealthCheckQueryParamsSchema,
  HealthStatusSchema
];
