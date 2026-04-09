/**
 * Canonical progress response contract for apprentice PWA progress pages.
 *
 * Every /api/pwa/[discipline]/progress endpoint MUST return this exact shape.
 * ApprenticeProgress.tsx validates against this — invalid responses are rejected
 * with a 500 before they reach the client.
 */

export interface ApprenticeProgressResponse {
  totalHoursApproved:      number;
  totalHoursPending:       number;
  requiredHours:           number;
  transferHours:           number;
  lmsCompleted:            boolean;
  lmsProgressPct:          number;   // 0–100
  practicalSkillsVerified: boolean;
  checkpointsPassed:       number;
  checkpointsTotal:        number;
  programLabel:            string;
  partnerShopName:         string | null;
  weeklyAvgHours:          number | null;
  projectedCompletionDate: string | null; // ISO date string or null
}

const REQUIRED_KEYS: (keyof ApprenticeProgressResponse)[] = [
  'totalHoursApproved',
  'totalHoursPending',
  'requiredHours',
  'transferHours',
  'lmsCompleted',
  'lmsProgressPct',
  'practicalSkillsVerified',
  'checkpointsPassed',
  'checkpointsTotal',
  'programLabel',
  'partnerShopName',
  'weeklyAvgHours',
  'projectedCompletionDate',
];

/**
 * Layer 1 — Shape validation.
 * Checks that all required fields are present and the correct primitive type.
 * Returns null if valid, or a string describing the first violation.
 */
export function validateProgressShape(data: unknown): string | null {
  if (!data || typeof data !== 'object') return 'Response is not an object';

  const obj = data as Record<string, unknown>;

  for (const key of REQUIRED_KEYS) {
    if (!(key in obj)) return `Missing required field: ${key}`;
  }

  if (typeof obj.totalHoursApproved !== 'number')       return 'totalHoursApproved must be a number';
  if (typeof obj.totalHoursPending !== 'number')         return 'totalHoursPending must be a number';
  if (typeof obj.requiredHours !== 'number')             return 'requiredHours must be a number';
  if (typeof obj.transferHours !== 'number')             return 'transferHours must be a number';
  if (typeof obj.lmsCompleted !== 'boolean')             return 'lmsCompleted must be a boolean';
  if (typeof obj.lmsProgressPct !== 'number')            return 'lmsProgressPct must be a number';
  if (typeof obj.practicalSkillsVerified !== 'boolean')  return 'practicalSkillsVerified must be a boolean';
  if (typeof obj.checkpointsPassed !== 'number')         return 'checkpointsPassed must be a number';
  if (typeof obj.checkpointsTotal !== 'number')          return 'checkpointsTotal must be a number';
  if (typeof obj.programLabel !== 'string')              return 'programLabel must be a string';

  return null;
}

/**
 * Layer 2 — Invariant validation (semantic / truth-safety).
 * Checks that values are internally consistent and logically valid.
 * Call this AFTER validateProgressShape passes.
 * Returns null if valid, or a string describing the first invariant violation.
 */
export function validateProgressInvariants(data: ApprenticeProgressResponse): string | null {
  const {
    totalHoursApproved,
    totalHoursPending,
    requiredHours,
    transferHours,
    lmsProgressPct,
    checkpointsPassed,
    checkpointsTotal,
    projectedCompletionDate,
    weeklyAvgHours,
  } = data;

  // Hours must be non-negative
  if (totalHoursApproved < 0)  return `totalHoursApproved is negative: ${totalHoursApproved}`;
  if (totalHoursPending < 0)   return `totalHoursPending is negative: ${totalHoursPending}`;
  if (transferHours < 0)       return `transferHours is negative: ${transferHours}`;
  if (requiredHours <= 0)      return `requiredHours must be positive: ${requiredHours}`;

  // Total hours cannot exceed required by more than 10% (data aggregation sanity check)
  const totalHours = totalHoursApproved + transferHours;
  if (totalHours > requiredHours * 1.1) {
    return `totalHours (${totalHours}) exceeds requiredHours (${requiredHours}) by more than 10% — possible aggregation error`;
  }

  // LMS progress must be 0–100
  if (lmsProgressPct < 0 || lmsProgressPct > 100) {
    return `lmsProgressPct out of range: ${lmsProgressPct}`;
  }

  // Checkpoints passed cannot exceed total
  if (checkpointsPassed > checkpointsTotal) {
    return `checkpointsPassed (${checkpointsPassed}) exceeds checkpointsTotal (${checkpointsTotal})`;
  }
  if (checkpointsPassed < 0 || checkpointsTotal < 0) {
    return `checkpoint counts cannot be negative`;
  }

  // Projected completion date must be in the future (or null)
  if (projectedCompletionDate !== null) {
    const projected = new Date(projectedCompletionDate);
    if (isNaN(projected.getTime())) {
      return `projectedCompletionDate is not a valid date: ${projectedCompletionDate}`;
    }
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (projected < today) {
      return `projectedCompletionDate (${projectedCompletionDate}) is in the past — projection logic error`;
    }
  }

  // Weekly average must be non-negative if present
  if (weeklyAvgHours !== null && weeklyAvgHours < 0) {
    return `weeklyAvgHours is negative: ${weeklyAvgHours}`;
  }

  // If hours are complete, projected date should be null (already done)
  if (totalHours >= requiredHours && projectedCompletionDate !== null) {
    return `projectedCompletionDate should be null when hours are already complete`;
  }

  return null;
}

/**
 * Convenience wrapper — runs both shape and invariant validation.
 * Returns null if fully valid, or a string describing the first failure.
 */
export function validateProgressResponse(data: unknown): string | null {
  const shapeError = validateProgressShape(data);
  if (shapeError) return shapeError;
  return validateProgressInvariants(data as ApprenticeProgressResponse);
}
