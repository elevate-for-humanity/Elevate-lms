/**
 * AI Internal Planner
 *
 * Goal-decomposition orchestrator. Takes a high-level goal, breaks it into
 * ordered steps, executes each step through the canonical Dev Studio task
 * runtime, verifies outcomes, and preserves approval/checkpoint state.
 *
 * Architecture:
 *   Goal → decompose() → PlanStep[] → ai_tasks runtime → verify → report
 */

export type StepStatus =
  | 'pending'
  | 'running'
  | 'done'
  | 'failed'
  | 'skipped'
  | 'awaiting_approval';

export interface PlanStep {
  id: string;
  order: number;
  title: string;
  command: string;
  depends_on?: string[];
  verify?: string;
  expected_output?: string;
  verification_rule?: string;
  max_attempts?: number;
  task_id?: string;
  status: StepStatus;
  output?: string;
  error?: string;
  evaluation?: 'PASS' | 'FAIL_RETRYABLE' | 'FAIL_BLOCKING' | 'REQUIRES_HUMAN_REVIEW';
}

export interface Plan {
  id: string;
  goal: string;
  steps: PlanStep[];
  created_at: string;
  status: 'pending' | 'running' | 'done' | 'failed' | 'awaiting_approval';
}

export const GOAL_TEMPLATES: Record<string, (params: Record<string, string>) => PlanStep[]> = {
  fix_enrollment_failures: () => [
    {
      id: 's1',
      order: 1,
      title: 'Get platform state',
      command: 'Get live platform state',
      status: 'pending',
      expected_output: 'Live platform state',
      verification_rule: 'A current platform state result must be returned.',
    },
    {
      id: 's2',
      order: 2,
      title: 'Audit enrollment pipeline',
      command: 'Audit enrollment pipeline',
      status: 'pending',
      depends_on: ['s1'],
      expected_output: 'Enrollment pipeline findings',
      verification_rule: 'The audit must return concrete findings or a clean result.',
    },
    {
      id: 's3',
      order: 3,
      title: 'Check DB integrity',
      command: 'Query database table enrollments limit=5',
      status: 'pending',
      depends_on: ['s1'],
      expected_output: 'Enrollment data integrity evidence',
      verification_rule: 'The query must execute without a database error.',
    },
    {
      id: 's4',
      order: 4,
      title: 'Inspect auth gaps',
      command: 'Run system audit scope=auth',
      status: 'pending',
      depends_on: ['s2'],
      expected_output: 'Authentication audit evidence',
    },
    {
      id: 's5',
      order: 5,
      title: 'Recall known issues',
      command: 'Recall operational memory type=issue search=enrollment',
      status: 'pending',
      depends_on: ['s1'],
      expected_output: 'Relevant prior enrollment issues',
    },
    {
      id: 's6',
      order: 6,
      title: 'Run QA scan',
      command: 'Run QA scan scope=enrollment',
      status: 'pending',
      depends_on: ['s2', 's3'],
      expected_output: 'Enrollment QA result',
      verification_rule: 'QA must complete and report its result.',
    },
  ],

  verify_program: (p) => [
    {
      id: 's1',
      order: 1,
      title: 'Registry lookup',
      command: `Lookup program registry slug=${p.slug}`,
      status: 'pending',
      expected_output: 'Canonical program registry result',
    },
    {
      id: 's2',
      order: 2,
      title: 'DB integrity check',
      command: `Verify program integrity ${p.slug}`,
      status: 'pending',
      depends_on: ['s1'],
      expected_output: 'Program integrity result',
    },
    {
      id: 's3',
      order: 3,
      title: 'Check enrollment flow',
      command: 'Run QA scan scope=enrollment',
      status: 'pending',
      depends_on: ['s2'],
      expected_output: 'Enrollment flow QA result',
    },
    {
      id: 's4',
      order: 4,
      title: 'Query live enrollments',
      command: 'Query database table enrollments limit=5',
      status: 'pending',
      depends_on: ['s2'],
      expected_output: 'Live enrollment evidence',
    },
  ],

  pre_deployment_check: (p) => [
    {
      id: 's1',
      order: 1,
      title: 'Platform state snapshot',
      command: 'Get live platform state',
      status: 'pending',
      expected_output: 'Current platform state',
    },
    {
      id: 's2',
      order: 2,
      title: 'Create snapshot',
      command: 'Create snapshot type=pre_deploy label=pre-deployment-check',
      status: 'pending',
      depends_on: ['s1'],
      expected_output: 'Pre-deployment snapshot reference',
    },
    {
      id: 's3',
      order: 3,
      title: 'Full QA scan',
      command: 'Run full platform QA scan',
      status: 'pending',
      depends_on: ['s1'],
      expected_output: 'Full QA result',
    },
    {
      id: 's4',
      order: 4,
      title: 'Auth gap check',
      command: 'Run system audit scope=auth',
      status: 'pending',
      depends_on: ['s1'],
      expected_output: 'Authentication audit result',
    },
    {
      id: 's5',
      order: 5,
      title: 'Inspect broken links',
      command: 'Inspect broken internal links',
      status: 'pending',
      depends_on: ['s3'],
      expected_output: 'Broken-link verification result',
    },
    {
      id: 's6',
      order: 6,
      title: 'Recall deployment history',
      command: 'Recall operational memory type=deployment',
      status: 'pending',
      depends_on: ['s1'],
      expected_output: 'Relevant deployment history',
    },
    ...(p.goal
      ? [
          {
            id: 's7',
            order: 7,
            title: 'Execute approved deployment',
            command: p.goal,
            status: 'pending' as const,
            depends_on: ['s3', 's4', 's5'],
            expected_output: 'Deployment execution result or explicit approval checkpoint',
            verification_rule:
              'The deployment tool must return an execution result or pause for authorized approval.',
            max_attempts: 1,
          },
        ]
      : []),
  ],

  onboard_new_program: (p) => [
    {
      id: 's1',
      order: 1,
      title: 'Check registry',
      command: `Lookup program registry slug=${p.slug}`,
      status: 'pending',
      expected_output: 'Canonical registry result',
    },
    {
      id: 's2',
      order: 2,
      title: 'Verify DB row',
      command: `Query database table programs filter=slug=${p.slug}`,
      status: 'pending',
      depends_on: ['s1'],
      expected_output: 'Canonical program row',
    },
    {
      id: 's3',
      order: 3,
      title: 'Check apply route',
      command: 'Scan routes filter=pages',
      status: 'pending',
      depends_on: ['s1'],
      expected_output: 'Application route evidence',
    },
    {
      id: 's4',
      order: 4,
      title: 'Verify enrollment flow',
      command: `Verify program integrity ${p.slug}`,
      status: 'pending',
      depends_on: ['s2'],
      expected_output: 'Enrollment integrity result',
    },
    {
      id: 's5',
      order: 5,
      title: 'Save onboarding note',
      command: `Save memory type=note title="Program onboarded: ${p.slug}" content="Program ${p.slug} verified and onboarded via AI planner"`,
      status: 'pending',
      depends_on: ['s4'],
      expected_output: 'Persisted onboarding memory',
    },
  ],

  platform_health_check: () => [
    {
      id: 's1',
      order: 1,
      title: 'Platform state',
      command: 'Get live platform state',
      status: 'pending',
      expected_output: 'Current platform state',
    },
    {
      id: 's2',
      order: 2,
      title: 'System audit',
      command: 'Run full system audit',
      status: 'pending',
      depends_on: ['s1'],
      expected_output: 'System audit result',
    },
    {
      id: 's3',
      order: 3,
      title: 'QA scan',
      command: 'Run full platform QA scan',
      status: 'pending',
      depends_on: ['s1'],
      expected_output: 'Platform QA result',
    },
    {
      id: 's4',
      order: 4,
      title: 'Knowledge graph',
      command: 'Lookup knowledge graph query=debt',
      status: 'pending',
      depends_on: ['s1'],
      expected_output: 'Architecture debt context',
    },
    {
      id: 's5',
      order: 5,
      title: 'Recall issues',
      command: 'Recall operational memory type=issue',
      status: 'pending',
      depends_on: ['s1'],
      expected_output: 'Relevant operational issues',
    },
    {
      id: 's6',
      order: 6,
      title: 'Save health snapshot',
      command: `Save memory type=audit title="Platform health check ${new Date().toISOString().slice(0, 10)}" content="Automated health check completed via AI planner"`,
      status: 'pending',
      depends_on: ['s2', 's3'],
      expected_output: 'Persisted health snapshot',
    },
  ],

  quickbooks_connection: () => [
    {
      id: 's1',
      order: 1,
      title: 'Verify QuickBooks connection',
      command: 'Check QuickBooks connection status',
      status: 'pending',
      expected_output: 'Live QuickBooks connection and company identity',
      verification_rule: 'The canonical QuickBooks status endpoint must return a current result.',
    },
  ],

  quickbooks_repair: () => [
    {
      id: 's1',
      order: 1,
      title: 'Verify QuickBooks connection',
      command: 'Check QuickBooks connection status',
      status: 'pending',
      expected_output: 'Live QuickBooks connection status',
    },
    {
      id: 's2',
      order: 2,
      title: 'Prepare authorized reconnection',
      command: 'Create QuickBooks authorization link',
      status: 'pending',
      depends_on: ['s1'],
      expected_output: 'Canonical Intuit authorization URL',
      verification_rule: 'A state-protected QuickBooks authorization URL must be returned.',
    },
  ],
};

export function decomposePlan(goal: string, params: Record<string, string> = {}): Plan {
  const g = goal.toLowerCase();
  let steps: PlanStep[];

  if (g.includes('quickbooks')) {
    steps = /\b(fix|repair|connect|reconnect|configure)\b/.test(g)
      ? GOAL_TEMPLATES.quickbooks_repair!({})
      : GOAL_TEMPLATES.quickbooks_connection!({});
  } else if (g.includes('enrollment') || g.includes('enroll')) {
    steps = GOAL_TEMPLATES.fix_enrollment_failures!({});
  } else if (/\bdeploy\b/.test(g)) {
    steps = GOAL_TEMPLATES.pre_deployment_check!({ goal });
  } else if (/\b(?:platform|system)\b.*\bhealth\b|\bhealth check\b/.test(g)) {
    steps = GOAL_TEMPLATES.platform_health_check!({});
  } else if ((g.includes('program') || g.includes('verify')) && params.slug) {
    steps = GOAL_TEMPLATES.verify_program!(params);
  } else if (g.includes('onboard') && params.slug) {
    steps = GOAL_TEMPLATES.onboard_new_program!(params);
  } else if (
    /\b(build|create|generate|fix|repair|correct|change|update|edit|improve|finish|complete|continue|publish|run|apply|rollback|push|sync|connect|reconnect|configure|execute|approve|send|issue|assign|mark|remove|add|onboard|audit|test|verify|check|inspect)\b/.test(
      g,
    )
  ) {
    steps = [
      {
        id: 's1',
        order: 1,
        title: 'Execute requested outcome',
        command: goal,
        status: 'pending',
        expected_output: 'Concrete tool result for the requested outcome',
        verification_rule:
          'A registered tool must return evidence of execution or an explicit approval checkpoint.',
        max_attempts: 2,
      },
    ];
  } else {
    steps = [
      {
        id: 's1',
        order: 1,
        title: 'Get platform state',
        command: 'Get live platform state',
        status: 'pending',
        expected_output: 'Current platform state',
      },
      {
        id: 's2',
        order: 2,
        title: 'Run system audit',
        command: 'Run full system audit',
        status: 'pending',
        depends_on: ['s1'],
        expected_output: 'System audit result',
      },
      {
        id: 's3',
        order: 3,
        title: 'Run QA scan',
        command: 'Run full platform QA scan',
        status: 'pending',
        depends_on: ['s2'],
        expected_output: 'QA result',
      },
      {
        id: 's4',
        order: 4,
        title: 'Recall known issues',
        command: 'Recall operational memory type=all',
        status: 'pending',
        depends_on: ['s1'],
        expected_output: 'Relevant operational memory',
      },
    ];
  }

  return {
    id: `plan-${Date.now()}`,
    goal,
    steps,
    created_at: new Date().toISOString(),
    status: 'pending',
  };
}

export function canExecuteStep(step: PlanStep, steps: PlanStep[]): boolean {
  if (!step.depends_on?.length) return true;
  return step.depends_on.every((depId) => {
    const dep = steps.find((candidate) => candidate.id === depId);
    return dep?.status === 'done';
  });
}
