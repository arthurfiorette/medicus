import type { Medicus } from '../medicus';
import { type HealthCheckResult, HealthStatus } from '../types';

/**
 * Converts a health status to an HTTP status code
 */
export function healthStatusToHttpStatus(status: HealthStatus): (typeof HttpStatuses)[number] {
  switch (status) {
    case HealthStatus.HEALTHY:
    case HealthStatus.DEGRADED:
      return 200;
    case HealthStatus.UNHEALTHY:
      return 503;
  }
}

/**
 * The list of HTTP status codes that can be returned by the health check
 */
export const HttpStatuses = [200, 503] as const;

/**
 * Performs a health check and returns both the result and HTTP status code
 *
 * This utility handles common health check query parameters like 'last' and 'simulate'
 * and provides a consistent interface for HTTP-based health check implementations.
 *
 * **This function never throws**
 */
export async function performHttpCheck<Ctx>(
  medicus: Medicus<Ctx>,
  isDebug: boolean,
  queryLast: boolean,
  simulateStatus?: HealthStatus
): Promise<{ result: HealthCheckResult; status: number }> {
  let result: HealthCheckResult | null = null;

  if (queryLast) {
    result = medicus.getLastCheck(isDebug);
  }

  if (!result) {
    result = await medicus.performCheck(isDebug);
  }

  if (simulateStatus) {
    result.status = simulateStatus;
  }

  return {
    result,
    status: healthStatusToHttpStatus(result.status)
  };
}

/**
 * Parses a health status string into a HealthStatus enum value.
 */
export function parseHealthStatus(value?: string | null): HealthStatus | undefined {
  switch (value) {
    case HealthStatus.DEGRADED:
    case HealthStatus.UNHEALTHY:
    case HealthStatus.HEALTHY:
      return value;
    default:
      return undefined;
  }
}
