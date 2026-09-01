/**
 * Every Admin AI prompt enters one governed execution path.
 *
 * The command runtime selects the registered tool, stages protected actions
 * for approval, records the audit trail, and returns advisory output only
 * when no executable capability exists. Capability workspaces remain
 * available for direct inspection; users do not choose one before asking.
 */

export type EllieMessageRoute = 'command' | 'ops' | 'platform';
export type StudioSpecialist = 'ADMIN_AI';

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

/** All requests enter one orchestrator. Internal capabilities are selected by
 * the server from intent and actual tool calls, never by a UI persona switch. */
export function selectStudioAgent(_message: string): StudioSpecialist {
  return 'ADMIN_AI';
}

export const ELLIE_ROUTE_LABEL: Record<EllieMessageRoute, string> = {
  command: 'Unified execution',
  ops: 'Unified execution',
  platform: 'Unified execution',
};
