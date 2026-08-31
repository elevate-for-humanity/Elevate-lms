/**
 * Every Admin AI prompt enters one governed execution path.
 *
 * The command runtime selects the registered tool, stages protected actions
 * for approval, records the audit trail, and returns advisory output only
 * when no executable capability exists. Capability workspaces remain
 * available for direct inspection; users do not choose one before asking.
 */

export type EllieMessageRoute = 'command' | 'ops' | 'platform';

// Outcome-oriented requests enter the governed command runtime. Keeping these
// phrases explicit makes the natural-language contract auditable while the
// command registry remains the only execution authority.
const OUTCOME_REQUEST_RE = /\b(?:build (?:a )?course|create (?:a )?course|generate (?:a )?course|build (?:a )?website|publish (?:the )?website)\b/i;
export const OUTCOME_REQUEST_PATTERNS = [
  'build (a )?course',
  'create (a )?course',
  'generate (a )?course',
  'build (a )?website',
  'publish (the )?website',
] as const;

export function routeEllieMessage(message: string): EllieMessageRoute {
  if (OUTCOME_REQUEST_RE.test(message)) return 'command';
  return 'command';
}

export const ELLIE_ROUTE_LABEL: Record<EllieMessageRoute, string> = {
  command: 'Unified execution',
  ops: 'Unified execution',
  platform: 'Unified execution',
};
