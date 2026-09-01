/**
 * Every Admin AI prompt enters one governed execution path.
 *
 * The command runtime selects the registered tool, stages protected actions
 * for approval, records the audit trail, and returns advisory output only
 * when no executable capability exists. Capability workspaces remain
 * available for direct inspection; users do not choose one before asking.
 */

export type EllieMessageRoute = 'command' | 'ops' | 'platform';
export type StudioSpecialist = 'PARIS' | 'ELLIE' | 'LIZZY' | 'ZORA';

// Outcome-oriented requests enter the governed command runtime. Keeping these
// phrases explicit makes the natural-language contract auditable while the
// command registry remains the only execution authority.
const OUTCOME_REQUEST_RE =
  /\b(?:build (?:a )?course|create (?:a )?course|generate (?:a )?course|build (?:a )?website|publish (?:the )?website)\b/i;
const OPS_REQUEST_RE =
  /\b(?:applications?|enrollments?|students?|payouts?|analytics|metrics|cohorts?|wioa|reminders?|certificates?|platform health|system health)\b/i;
const PLATFORM_REQUEST_RE =
  /\b(?:code|repository|repo|route|component|schema|migration|typescript|workflow|deployment|browser|live site|production page|course|curriculum|lesson|assessment|website|claim|compliance|policy|audit|security)\b/i;
export const OUTCOME_REQUEST_PATTERNS = [
  'build (a )?course',
  'create (a )?course',
  'generate (a )?course',
  'build (a )?website',
  'publish (the )?website',
] as const;

export function routeEllieMessage(message: string): EllieMessageRoute {
  if (OUTCOME_REQUEST_RE.test(message)) return 'platform';
  if (OPS_REQUEST_RE.test(message)) return 'ops';
  if (PLATFORM_REQUEST_RE.test(message)) return 'platform';
  return 'command';
}

/** Selects a specialist role; execution remains governed by the shared tool registry. */
export function selectStudioAgent(message: string): StudioSpecialist {
  const normalized = message.toLowerCase();
  if (
    /\b(compliance|policy|audit|evidence|claim|security|rls|ferpa|accessibility|credential verification)\b/.test(
      normalized,
    )
  )
    return 'ZORA';
  if (
    /\b(course|curriculum|lesson|assessment|learning objective|learner|remediation|instruction|teaching)\b/.test(
      normalized,
    )
  )
    return 'ELLIE';
  if (
    /\b(website|business interview|public guide|admissions|career pathway|job match|customer|lead|conversion|seo)\b/.test(
      normalized,
    )
  )
    return 'PARIS';
  return 'LIZZY';
}

export const ELLIE_ROUTE_LABEL: Record<EllieMessageRoute, string> = {
  command: 'Unified execution',
  ops: 'Unified execution',
  platform: 'Unified execution',
};
