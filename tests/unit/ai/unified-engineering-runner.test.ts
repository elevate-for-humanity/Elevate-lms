import { describe, expect, it } from 'vitest';
import {
  buildUnifiedEngineeringStages,
  ENGINEERING_RUNNER_CAPABILITIES,
} from '@/lib/devstudio/engineering-runner/plan';
import { planAIToolFromCommand } from '@/lib/ai/tools/planner';

describe('unified engineering runner planning', () => {
  it('uses only repository work and authoritative CI for a backend repair', () => {
    const stages = buildUnifiedEngineeringStages('Fix the repository API route and add tests');
    expect(stages.map((stage) => stage.runner)).toEqual(['openhands', 'github-actions']);
  });

  it('adds browser QA for user-facing work', () => {
    const stages = buildUnifiedEngineeringStages('Fix the homepage layout and test the live site');
    expect(stages.map((stage) => stage.id)).toEqual(['engineering', 'ci', 'browser-qa']);
    expect(stages[2]?.dependsOn).toEqual(['ci']);
  });

  it('gates deployment and production verification behind prior evidence', () => {
    const stages = buildUnifiedEngineeringStages(
      'Fix the dashboard code, test it in the browser, deploy to production, and verify it',
    );
    expect(stages.map((stage) => stage.id)).toEqual([
      'engineering',
      'ci',
      'browser-qa',
      'deploy',
      'production-verify',
    ]);
    expect(stages.at(-1)?.dependsOn).toEqual(['deploy']);
  });

  it('keeps browser-local validation advisory and CI authoritative', () => {
    expect(ENGINEERING_RUNNER_CAPABILITIES.webcontainer).toEqual({
      mode: 'browser-local',
      authority: 'advisory-validation',
    });
    expect(ENGINEERING_RUNNER_CAPABILITIES['github-actions'].authority).toBe('ci-and-deployment');
  });

  it('routes every executable stage to its intended registered runner', () => {
    const stages = buildUnifiedEngineeringStages(
      'Fix the homepage component, deploy to production, and verify the live site',
    );
    expect(stages.map((stage) => planAIToolFromCommand(stage.command)?.name)).toEqual([
      'openhands.execute',
      'workflows.runTests',
      'browser.execute',
      'deployments.autopilot',
      'browser.execute',
    ]);
  });
});
