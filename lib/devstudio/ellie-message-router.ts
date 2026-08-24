/**
 * Routes a single Admin AI message to the correct existing backend:
 * - command  → /api/admin/dev-studio/execute (explicit deploy/smoke/test execution)
 * - ops      → /api/admin/ai-assistant (live admin data + staged approvals)
 * - platform → /api/admin/dev-studio/chat (tool orchestration: courses, websites, code, schema, documents)
 *
 * Product rule: business outcomes such as "build a course" must route to the
 * platform tool orchestrator, never to the raw command executor.
 */

export type EllieMessageRoute = 'command' | 'ops' | 'platform';

const COMMAND_RE =
  /^(deploy\b|run smoke|smoke\s*test|force[- ]?redeploy|check system health|system health|run tests?\b|git push|trigger (the )?(lms|admin|studio) deploy)/i;

const OPS_RE =
  /\b(pending application|approve application|reject application|at[- ]?risk|send reminder|how many (student|enrollment|application)|dashboard stat|live data|schedule exam|cancel exam|magic link|case manager|program holder|wioa|compliance alert|hot lead)\b/i;

const PLATFORM_RE =
  /\b(build (a )?course|create (a )?course|generate (a )?course|course builder|build (a )?website|create (a )?website|website builder|publish (the )?website|fix|bug|broken|error|failing|route\.ts|middleware|migration|schema|rls|component|search code|inspect|blueprint|generate video|course id|supabase|deploy did not|ecs|container|build spec)\b/i;

export function routeEllieMessage(message: string): EllieMessageRoute {
  const text = message.trim();
  if (!text) return 'platform';

  if (PLATFORM_RE.test(text)) return 'platform';
  if (COMMAND_RE.test(text)) return 'command';
  if (OPS_RE.test(text)) return 'ops';

  if (/^(how many|what('s| is) the|show (me )?|list )/i.test(text) && text.length < 120) return 'ops';

  return 'platform';
}

export const ELLIE_ROUTE_LABEL: Record<EllieMessageRoute, string> = {
  command: 'Command',
  ops: 'Ops',
  platform: 'Platform tools',
};
