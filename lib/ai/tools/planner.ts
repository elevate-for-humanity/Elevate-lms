import 'server-only';

import { getAITool } from './registry';

export type PlannedAITool = {
  name: string;
  input: Record<string, unknown>;
};

export function asAIRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function extractUuid(text: string): string | null {
  return text.match(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i)?.[0] ?? null;
}

function extractNamedFilter(command: string, label: string): string | null {
  const match = command.match(new RegExp(`\\b${label}\\s+([a-z0-9_-]+)`, 'i'));
  return match?.[1]?.trim() || null;
}

function wioaFollowupInput(command: string, context: Record<string, unknown>): Record<string, unknown> {
  const input = { ...asAIRecord(context.toolInput) };
  const lower = command.toLowerCase();
  if (/30\s*[- ]?day/.test(lower)) input.type = '30-day';
  if (/\b(overdue|past due|missing|missed)\b/.test(lower)) input.overdue = true;
  const sector = extractNamedFilter(command, 'sector');
  const program = extractNamedFilter(command, 'program');
  if (sector) input.sector = sector;
  if (program) input.program = program;
  return input;
}

function isOpenHandsStatusCommand(lower: string): boolean {
  return /\bopenhands\b/.test(lower) && /\b(status|progress|state|check|result|finished|running)\b/.test(lower);
}

function isEngineeringCommand(lower: string): boolean {
  if (/\bopenhands\b/.test(lower)) return true;
  const engineeringNoun = /\b(code|codebase|repo|repository|github|pull request|pr\b|branch|commit|typescript|javascript|route|component|api endpoint|test file|regression test|ci\b|workflow file|source file)\b/.test(lower);
  const engineeringVerb = /\b(fix|debug|refactor|implement|modify|change|update|edit|review|write|add|remove|clean up|cleanup|test)\b/.test(lower);
  return engineeringNoun && engineeringVerb;
}

function isLiveBrowserWork(lower: string): boolean {
  const browserTarget = /\b(live (site|website|page|dashboard)|cloud browser|browser|production (site|page|dashboard)|host shop dashboard)\b/.test(lower);
  const action = /\b(open|audit|check|inspect|test|verify|fix|repair|click through|walk through)\b/.test(lower);
  return browserTarget && action;
}

/**
 * Deterministic planner for operational commands.
 *
 * This is intentionally rules-first. A model may explain a command, but a
 * write action is only executable when it maps to a registered tool here (or
 * an explicit registered tool name is supplied by a trusted caller).
 */
export function planAIToolFromCommand(
  command: string,
  context: Record<string, unknown> = {},
): PlannedAITool | null {
  const explicitTool = typeof context.toolName === 'string' ? context.toolName : null;
  if (explicitTool && getAITool(explicitTool)) {
    return { name: explicitTool, input: asAIRecord(context.toolInput) };
  }

  const lower = command.toLowerCase();
  const contextId = typeof context.id === 'string' ? context.id : null;
  const id = contextId ?? extractUuid(command);

  if (/\bwioa\b/.test(lower) && /\b(follow[- ]?ups?|30\s*[- ]?day|overdue|past due|missing|missed)\b/.test(lower)) {
    return { name: 'wioa.followups', input: wioaFollowupInput(command, context) };
  }
  if (/\bwioa\b/.test(lower) && /\b(performance|outcomes?|metrics?|narrative|report|earnings|credential|skill gain)\b/.test(lower)) {
    return { name: 'wioa.performance', input: asAIRecord(context.toolInput) };
  }
  if (/\bwioa\b/.test(lower) && /\b(list|show|find|search|participants?)\b/.test(lower)) {
    return { name: 'wioa.list', input: asAIRecord(context.toolInput) };
  }
  if (/\b(list|show|review|find|search)\b.*\bapplications?\b/.test(lower) || /\bpending applications?\b/.test(lower)) {
    return { name: 'applications.search', input: asAIRecord(context.toolInput) };
  }
  if (/\bapprove\b.*\bapplication\b/.test(lower)) {
    return { name: 'applications.approve', input: { ...asAIRecord(context.toolInput), ...(id ? { id } : {}) } };
  }
  if (/\b(list|show|find|search)\b.*\bstudents?\b/.test(lower)) {
    return { name: 'students.search', input: asAIRecord(context.toolInput) };
  }
  if (/\b(assign|start|create)\b.*\b(ai[- ]?(counselor|coach|coaching)|student[- ]?success intervention)\b/.test(lower)) {
    return {
      name: 'risk.assignCounselor',
      input: { ...asAIRecord(context.toolInput), ...(id ? { userId: id } : {}) },
    };
  }
  if (/\b(list|show|find|search)\b.*\benrollments?\b/.test(lower)) {
    return { name: 'enrollments.search', input: asAIRecord(context.toolInput) };
  }
  if (/\b(create|enroll)\b.*\benrollment\b|\benroll\b.*\bstudent\b/.test(lower)) {
    return { name: 'enrollments.create', input: asAIRecord(context.toolInput) };
  }
  if (/\b(list|show|find)\b.*\bprograms?\b/.test(lower)) {
    return { name: 'programs.list', input: asAIRecord(context.toolInput) };
  }
  if (/\b(system|platform)\b.*\b(health|status)\b|\bhealth check\b/.test(lower)) {
    return { name: 'system.health', input: {} };
  }
  if (/\b(analytics|metrics|dashboard numbers)\b/.test(lower)) {
    return { name: 'analytics.read', input: asAIRecord(context.toolInput) };
  }
  if (/\bpayout\b.*\b(queue|pending|list|show)\b|\b(queue|pending|list|show)\b.*\bpayout/.test(lower)) {
    return { name: 'payouts.list', input: asAIRecord(context.toolInput) };
  }
  if (/\bmark\b.*\bpayout\b.*\bpaid\b/.test(lower)) {
    return { name: 'payouts.markPaid', input: { ...asAIRecord(context.toolInput), ...(id ? { enrollmentId: id } : {}) } };
  }
  if (/\b(issue|generate)\b.*\bcertificate/.test(lower)) {
    return { name: 'certificates.issue', input: asAIRecord(context.toolInput) };
  }
  if (/\b(send|email)\b.*\breminder/.test(lower)) {
    return { name: 'communications.remind', input: asAIRecord(context.toolInput) };
  }
  // Domain generation stays inside Elevate's canonical Course Builder, never OpenHands.
  if (/\b(generate|build|create)\b.*\bcourse\b/.test(lower)) {
    return { name: 'courses.generate', input: { ...asAIRecord(context.toolInput), prompt: command } };
  }
  if (/\b(build|generate)\b.*\b(all )?courses?\b/.test(lower)) {
    return { name: 'workflows.buildCourses', input: asAIRecord(context.toolInput) };
  }

  // OpenHands is an engineering worker, not a general platform action router.
  if (isOpenHandsStatusCommand(lower)) {
    return { name: 'openhands.status', input: asAIRecord(context.toolInput) };
  }
  if (isLiveBrowserWork(lower) || isEngineeringCommand(lower)) {
    return {
      name: 'openhands.execute',
      input: {
        ...asAIRecord(context.toolInput),
        task: isLiveBrowserWork(lower)
          ? `Use the configured authenticated cloud-browser and repository capabilities to complete this request end to end. Inspect the live page, capture evidence, repair implementation defects, run relevant checks, and verify the live result. Do not stop at advice when an executable capability is available. User request: ${command}`
          : command,
      },
    };
  }

  if (/\brun\b.*\btests?\b/.test(lower)) {
    return { name: 'workflows.runTests', input: asAIRecord(context.toolInput) };
  }
  if (/\bdeploy\b/.test(lower)) {
    return { name: 'deployments.autopilot', input: asAIRecord(context.toolInput) };
  }
  if (/\bapply\b.*\bmigrations?\b|\brun\b.*\bmigrations?\b/.test(lower)) {
    return { name: 'migrations.applyAll', input: asAIRecord(context.toolInput) };
  }
  if (/\brollback\b.*\bmigrations?\b/.test(lower)) {
    return { name: 'migrations.rollback', input: asAIRecord(context.toolInput) };
  }
  if (/\b(push|git push)\b/.test(lower)) {
    return { name: 'devstudio.gitPush', input: asAIRecord(context.toolInput) };
  }

  return null;
}

export function commandApprovalConfirmation(
  command: string,
  body: Record<string, unknown>,
  toolName: string,
): unknown {
  if (typeof body.confirmationText === 'string') return body.confirmationText;
  const required = getAITool(toolName)?.confirmationPhrase;
  if (required && command.includes(required)) return required;
  return undefined;
}
