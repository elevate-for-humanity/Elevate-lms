/**
 * Every Admin AI prompt enters one governed execution path.
 *
 * The command runtime selects the registered tool, stages protected actions
 * for approval, records the audit trail, and returns advisory output only
 * when no executable capability exists. Capability workspaces remain
 * available for direct inspection; users do not choose one before asking.
 */

export type EllieMessageRoute = 'command' | 'ops' | 'platform';
export type StudioSpecialist = 'ELLIE' | 'LIZZY' | 'PARIS';

// Outcome-oriented requests enter the governed command runtime. Keeping these
// phrases explicit makes the natural-language contract auditable while the
// command registry remains the only execution authority.
const OUTCOME_REQUEST_RE =
  /\b(?:build (?:a )?course|create (?:a )?course|generate (?:a )?course|build (?:a )?website|publish (?:the )?website)\b/i;
const OPS_REQUEST_RE =
  /\b(?:applications?|enrollments?|students?|payouts?|analytics|metrics|cohorts?|wioa|reminders?|certificates?|platform health|system health)\b/i;
const PLATFORM_REQUEST_RE =
  /\b(?:code|repository|repo|route|component|schema|migration|typescript|workflow|deployment|browser|live site|production page|course|curriculum|lesson|assessment|website|claim|compliance|policy|audit|security)\b/i;
const NATURAL_ACTION_RE =
  /\b(?:fix|repair|correct|change|update|edit|improve|finish|complete|continue|check|inspect|test|verify|open|show|find|explain|help)\b/i;
const DETERMINISTIC_COMMAND_RE =
  /\b(?:deploy|run (?:the )?tests?|apply (?:all )?migrations?|rollback (?:the )?migration|git push)\b/i;
const EXECUTION_VERB_RE =
  /\b(?:build|create|generate|fix|repair|correct|change|update|edit|improve|finish|complete|continue|deploy|publish|run|apply|rollback|push|sync|connect|reconnect|configure|execute|approve|send|issue|assign|mark|remove|add|onboard)\b/i;
const VERIFIED_OPERATION_RE = /\b(?:audit|test|verify|check|inspect)\b/i;
const EXECUTABLE_TARGET_RE =
  /\b(?:quickbooks|integration|workflow|deployment|production|live site|dashboard|website|browser|repository|repo|code|route|component|schema|migration|course|lesson|student|application|enrollment|payout|certificate|email|database|rls|platform|system)\b/i;
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
  if (DETERMINISTIC_COMMAND_RE.test(message)) return 'command';
  // Natural follow-ups (for example, "Can you fix this?") require the
  // conversation history, attachments, retrieved context, and the complete
  // unified tool-capable orchestrator. The legacy command endpoint is intentionally
  // stateless and must only receive explicit deterministic operations such as
  // deploy. Sending ordinary language there discards the referent of "this"
  // and produces a misleading analysis-only response.
  if (NATURAL_ACTION_RE.test(message)) return 'platform';
  return 'platform';
}

/**
 * Decide whether the single Admin AI surface should create a durable plan.
 * Questions remain on the conversational path; requested outcomes and
 * evidence-producing operational checks enter plan â execute â evaluate.
 */
export function shouldOrchestrateMessage(message: string): boolean {
  if (OUTCOME_REQUEST_RE.test(message) || DETERMINISTIC_COMMAND_RE.test(message)) return true;
  if (EXECUTION_VERB_RE.test(message)) return true;
  return VERIFIED_OPERATION_RE.test(message) && EXECUTABLE_TARGET_RE.test(message);
}

/** All requests enter one orchestrator. Internal capabilities are selected by
 * the server from intent and actual tool calls, never by a UI persona switch. */
export function selectStudioAgent(_message: string): StudioSpecialist {
  return 'LIZZY';
}

export const ELLIE_ROUTE_LABEL: Record<EllieMessageRoute, string> = {
  command: 'Unified execution',
  ops: 'Unified execution',
  platform: 'Unified execution',
};
