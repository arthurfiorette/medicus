import { type DetailedHealthCheck, HealthStatus } from '../types';

/**
 * A predefined detailed health check result indicating a timeout.
 */
export const TimeoutUnhealthyCheck: DetailedHealthCheck = {
  status: HealthStatus.UNHEALTHY,
  debug: {
    timeout: true,
    error: 'Health check timed out'
  }
};
