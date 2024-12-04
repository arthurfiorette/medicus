import { Type } from '@sinclair/typebox';
import { HealthStatus } from './types';

export const HealthStatusSchema = Type.Enum(HealthStatus);

export const DetailedHealthCheckSchema = Type.Object(
  {
    status: HealthStatusSchema,
    debug: Type.Optional(
      Type.Record(Type.String(), Type.Union([Type.Number(), Type.Boolean(), Type.String()]))
    )
  },
  {
    additionalProperties: false
  }
);

export const HealthCheckResultSchema = Type.Object(
  {
    status: HealthStatusSchema,
    services: Type.Record(Type.String(), DetailedHealthCheckSchema)
  },
  {
    additionalProperties: false
  }
);

export const HealthCheckQueryParamsSchema = Type.Object(
  {
    last: Type.Optional(
      Type.Boolean({
        description: 'If set to true, the last health check result will be returned'
      })
    ),
    simulate: Type.Optional(HealthStatusSchema)
  },
  {
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
