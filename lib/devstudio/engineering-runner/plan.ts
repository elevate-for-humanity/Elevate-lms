export type EngineeringRunnerId =
  | 'openhands'
  | 'webcontainer'
  | 'github-actions'
  | 'studio-browser';

export type EngineeringStageSpec = {
  id: string;
  title: string;
  command: string;
  runner: EngineeringRunnerId;
  dependsOn?: string[];
  expectedOutput: string;
  verificationRule: string;
  maxAttempts: number;
};

const UI_TARGET_RE =
  /\b(browser|live site|production page|website|homepage|dashboard|visual|layout|responsive|mobile|store|program page)\b/i;
const DEPLOY_RE = /\b(deploy|deployment|publish|production|push to main)\b/i;

/**
 * Provider-neutral engineering plan. Runner names are execution capabilities,
 * not UI personas, and dependencies prevent tests or deployment from racing
 * ahead of independently verified repository work.
 *
 * WebContainer is intentionally represented as a client-side accelerator, not
 * a headless authority. GitHub Actions remains the durable CI verifier.
 */
export function buildUnifiedEngineeringStages(goal: string): EngineeringStageSpec[] {
  const stages: EngineeringStageSpec[] = [
    {
      id: 'engineering',
      title: 'Implement repository outcome',
      command: goal,
      runner: 'openhands',
      expectedOutput: 'Repository branch or pull request with concrete changed-file evidence',
      verificationRule:
        'A registered engineering runner must return independently verified repository evidence.',
      maxAttempts: 3,
    },
    {
      id: 'ci',
      title: 'Run authoritative CI validation',
      // Keep the executable command deterministic. Adding incidental words
      // such as repository/workflow causes the command router to interpret
      // this as another coding request instead of the registered test runner.
      command: 'Run tests',
      runner: 'github-actions',
      dependsOn: ['engineering'],
      expectedOutput: 'Completed GitHub Actions test run with non-failing checks',
      verificationRule: 'The test workflow must complete and report its check results.',
      maxAttempts: 2,
    },
  ];

  let previous = 'ci';
  if (UI_TARGET_RE.test(goal)) {
    stages.push({
      id: 'browser-qa',
      title: 'Verify the user experience',
      command: 'Audit the live production site in the Studio Browser and report visual, console, network, and interaction failures',
      runner: 'studio-browser',
      dependsOn: [previous],
      expectedOutput: 'Durable Studio Browser QA evidence',
      verificationRule: 'Browser QA must return an explicit clean result or concrete failures.',
      maxAttempts: 2,
    });
    previous = 'browser-qa';
  }

  if (DEPLOY_RE.test(goal)) {
    stages.push({
      id: 'deploy',
      title: 'Deploy the verified build',
      command: 'Deploy the approved production build',
      runner: 'github-actions',
      dependsOn: [previous],
      expectedOutput: 'Authorized deployment run and deployment identifier',
      verificationRule: 'The deployment workflow must be accepted by the authorized deployment runtime.',
      maxAttempts: 1,
    });
    stages.push({
      id: 'production-verify',
      title: 'Verify production',
      command: 'Audit the live production site after deployment and verify health, rendering, console, network, and critical interactions',
      runner: 'studio-browser',
      dependsOn: ['deploy'],
      expectedOutput: 'Post-deployment browser and health verification evidence',
      verificationRule: 'Production verification must report an explicit clean result or concrete failures.',
      maxAttempts: 2,
    });
  }

  return stages;
}

export const ENGINEERING_RUNNER_CAPABILITIES = {
  openhands: { mode: 'server', authority: 'repository-mutation' },
  webcontainer: { mode: 'browser-local', authority: 'advisory-validation' },
  'github-actions': { mode: 'server', authority: 'ci-and-deployment' },
  'studio-browser': { mode: 'server', authority: 'browser-qa' },
} as const;
