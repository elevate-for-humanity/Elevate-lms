import 'server-only';


export type CapabilityHealthStatus =
  | 'healthy'
  | 'degraded'
  | 'unavailable';


export interface CapabilityHealthCheck {
  name: string;
  passed: boolean;
  message: string;
  required: boolean;
}


export interface CapabilityHealth {
  capability: string;
  status: CapabilityHealthStatus;
  configured: boolean;
  checks: CapabilityHealthCheck[];
  checkedAt: string;
}


export function buildCapabilityHealth(
  capability: string,
  checks: CapabilityHealthCheck[],
): CapabilityHealth {
  const requiredChecks = checks.filter(
    (check) => check.required,
  );


  const configured = requiredChecks.every(
    (check) => check.passed,
  );


  const failedRequired = requiredChecks.filter(
    (check) => !check.passed,
  );


  const failedOptional = checks.filter(
    (check) => !check.required && !check.passed,
  );


  let status: CapabilityHealthStatus = 'healthy';


  if (failedRequired.length > 0) {
    status = 'unavailable';
  } else if (failedOptional.length > 0) {
    status = 'degraded';
  }


  return {
    capability,
    status,
    configured,
    checks,
    checkedAt: new Date().toISOString(),
  };
}
