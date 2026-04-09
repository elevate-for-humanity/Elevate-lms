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
 * Validates a progress payload against the contract.
 * Returns null if valid, or a string describing the first violation.
 */
export function validateProgressResponse(data: unknown): string | null {
  if (!data || typeof data !== 'object') return 'Response is not an object';

  const obj = data as Record<string, unknown>;

  for (const key of REQUIRED_KEYS) {
    if (!(key in obj)) return `Missing required field: ${key}`;
  }

  if (typeof obj.totalHoursApproved !== 'number')      return 'totalHoursApproved must be a number';
  if (typeof obj.totalHoursPending !== 'number')        return 'totalHoursPending must be a number';
  if (typeof obj.requiredHours !== 'number')            return 'requiredHours must be a number';
  if (typeof obj.transferHours !== 'number')            return 'transferHours must be a number';
  if (typeof obj.lmsCompleted !== 'boolean')            return 'lmsCompleted must be a boolean';
  if (typeof obj.lmsProgressPct !== 'number')           return 'lmsProgressPct must be a number';
  if (obj.lmsProgressPct < 0 || obj.lmsProgressPct > 100) return 'lmsProgressPct must be 0–100';
  if (typeof obj.practicalSkillsVerified !== 'boolean') return 'practicalSkillsVerified must be a boolean';
  if (typeof obj.checkpointsPassed !== 'number')        return 'checkpointsPassed must be a number';
  if (typeof obj.checkpointsTotal !== 'number')         return 'checkpointsTotal must be a number';
  if (typeof obj.programLabel !== 'string')             return 'programLabel must be a string';

  return null;
}
