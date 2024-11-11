import { HealthStatus } from '../types';

/**
 * Converts a health status to an HTTP status code
 */
export function healthStatusToHttpStatus(status: HealthStatus): (typeof HttpStatuses)[number] {
  switch (status) {
    case HealthStatus.HEALTHY:
      return 200;
    case HealthStatus.DEGRADED:
      return 429;
    case HealthStatus.UNHEALTHY:
      return 503;
  }
}

/**
 * The list of HTTP status codes that can be returned by the health check
 */
export const HttpStatuses = [200, 429, 503] as const;
