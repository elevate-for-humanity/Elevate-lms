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
  // Database identities include newer UUID versions; routing must not discard
  // a valid persisted UUID merely because its version nibble is above v5.
  return text.match(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i)?.[0] ?? null;
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

  const personAtElevate = command.match(/\bwho is\s+(.+?)\s+(?:at|with)\s+elevate(?:\s+for\s+humanity)?\b/i);
  if (personAtElevate?.[1]) {
    return { name: 'organization.directory', input: { query: personAtElevate[1].trim() } };
  }

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
  if (/\b(create|make|generate|render)\b.*\b(commercial|promo|promotional)\b.*\bvideo\b|\bcommercial video\b/.test(lower)) {
    const duration = Number(lower.match(/\b(15|30|45|60|90)\s*[- ]?second/)?.[1] ?? 30);
    const aspectRatio = lower.includes('9:16') ? '9:16' : lower.includes('1:1') ? '1:1' : '16:9';
    return {
      name: 'video.generate',
      input: {
        action: 'render',
        projectName: 'Admin AI Commercial',
        title: 'Elevate for Humanity Commercial',
        prompt: command,
        audience: 'prospective learners, employers, training providers, and community partners',
        objective: 'demonstrate verified Elevate platform workflows',
        cta: 'Explore the Elevate demos',
        durationSeconds: duration,
        aspectRatio,
        sourceMode: 'hybrid',
        tone: 'professional',
        voice: 'coral',
        includeCaptions: true,
      },
    };
  }
  if (/\b(store demos?|demo routes?)\b/.test(lower) && /\b(scan|audit|inspect|test|verify|fix|repair)\b/.test(lower)) {
    return {
      name: 'openhands.execute',
      input: {
        ...asAIRecord(context.toolInput),
        task: `Audit and repair the public Store demos using repository and live-browser evidence. Do not publish or deploy. User request: ${command}`,
      },
    };
  }
  // Workflow inspection is only for requests whose subject is workflow/build
  // execution state. Do not let an incidental phrase such as "claims that do
  // not match the real workflow" hijack a browser or engineering audit.
  if (
    /\b(workflows?|course build|course generation)\b/.test(lower) &&
    /\b(status|progress|state|current|running|failed|failure|completion|queue|task)\b/.test(lower) &&
    !/\b(store demos?|demo routes?|live browser|public store|broken links?|mobile layout|console errors?|api errors?)\b/.test(lower)
  ) {
    return { name: 'workflows.inspect', input: asAIRecord(context.toolInput) };
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
  // Existing course media repair is Course Builder work. Route it before the
  // generic engineering/browser rules so words such as "repair", "endpoint",
  // or "dashboard" cannot accidentally dispatch an unauthorized OpenHands job.
  if (
    /\b(course|lesson)\b/.test(lower) &&
    /\b(videos?|media|mp4s?|captions?|transcripts?|assets?)\b/.test(lower) &&
    /\b(repair|fix|replace|restore|recover|rerender|re-render|audit|publish|finish|resume)\b/.test(lower)
  ) {
    return {
      name: 'courses.generate',
      input: {
        ...asAIRecord(context.toolInput),
        action: 'start',
        goal: command,
        ...(id ? { courseId: id } : {}),
      },
    };
  }
  if (/\b(send|email)\b.*\breminder/.test(lower)) {
    return { name: 'communications.remind', input: asAIRecord(context.toolInput) };
  }
  // Domain generation stays inside Elevate's canonical Course Builder, never OpenHands.
  if (/\b(generate|build|create|finish|complete|resume)\b.*\bcourse\b/.test(lower)) {
    return {
      name: 'courses.generate',
      input: {
        ...asAIRecord(context.toolInput),
        action: 'start',
        goal: command,
        ...(id ? { courseId: id } : {}),
      },
    };
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
  if (/\bdeploy\b/.test(lower) && !/\b(?:do not|don't|dont|never|without)\s+(?:\w+\s+){0,2}deploy\b/.test(lower)) {
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
