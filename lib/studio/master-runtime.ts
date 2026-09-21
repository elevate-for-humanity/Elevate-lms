import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { decomposePlan, type Plan } from '@/lib/platform/planner';
import { ensureCanonicalStudioRun, appendStudioRunEvent } from '@/lib/devstudio/studio-run';

export type MasterStudioSpecialist = 'ELLIE' | 'PARIS' | 'LIZZY' | 'ZORA' | 'OPENHANDS' | 'ROUTER';

const SPECIALIST_RULES: Array<{ specialist: MasterStudioSpecialist; pattern: RegExp }> = [
  { specialist: 'ELLIE', pattern: /\b(course|curriculum|lesson|assessment|student|lms|credential)\b/i },
  { specialist: 'PARIS', pattern: /\b(application|admission|interview|website|marketing|workforce|employer|media)\b/i },
  { specialist: 'ZORA', pattern: /\b(compliance|policy|audit|security|rls|claim|governance)\b/i },
  { specialist: 'OPENHANDS', pattern: /\b(refactor|typescript|repository|codebase|multi-file|implementation)\b/i },
  { specialist: 'LIZZY', pattern: /\b(deploy|build|container|operations|github|database|supabase|workflow|runtime)\b/i },
];

export function selectMasterStudioSpecialist(command: string): MasterStudioSpecialist {
  return SPECIALIST_RULES.find((rule) => rule.pattern.test(command))?.specialist ?? 'ROUTER';
}

export function prepareMasterStudioPlan(goal: string, params: Record<string, string> = {}): Plan {
  const plan = decomposePlan(goal, params);
  return {
    ...plan,
    steps: plan.steps.map((step) => ({
      ...step,
      runner: step.runner || selectMasterStudioSpecialist(step.command),
    })),
  };
}

export async function createMasterStudioRun(
  db: SupabaseClient,
  input: {
    actorId: string;
    conversationId?: string;
    organizationId?: string;
    courseId?: string;
    goal: string;
    params?: Record<string, string>;
  },
) {
  const plan = prepareMasterStudioPlan(input.goal, input.params);
  const run = await ensureCanonicalStudioRun(db, {
    actorId: input.actorId,
    conversationId: input.conversationId,
    organizationId: input.organizationId,
    courseId: input.courseId,
    command: input.goal,
    plan,
  });
  await appendStudioRunEvent(db, run.id, 'master.plan.ready', 'Master Studio plan prepared', {
    plan_id: plan.id,
    specialists: [...new Set(plan.steps.map((step) => step.runner).filter(Boolean))],
    step_count: plan.steps.length,
  });
  return { run, plan };
}
