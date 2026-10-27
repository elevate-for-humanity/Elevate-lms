import { describe, expect, it } from 'vitest';
import {
  buildUnifiedEngineeringStages,
  ENGINEERING_RUNNER_CAPABILITIES,
} from '@/lib/devstudio/engineering-runner/plan';
import { planAIToolFromCommand } from '@/lib/ai/tools/planner';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('unified engineering runner planning', () => {
  it('uses only repository work and authoritative CI for a backend repair', () => {
    const stages = buildUnifiedEngineeringStages('Fix the repository API route and add tests');
    expect(stages.map((stage) => stage.runner)).toEqual(['studio-engineering', 'github-actions']);
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
      'studio.engineering.execute',
      'workflows.runTests',
      'browser.execute',
      'deployments.autopilot',
      'browser.execute',
    ]);
  });

  it('dispatches internal engineering in-process and keeps OpenHands opt-in', () => {
    const executor = readFileSync(resolve('lib/ai/tools/executor.ts'), 'utf8');
    const planner = readFileSync(resolve('lib/ai/tools/planner.ts'), 'utf8');
    expect(executor).toContain("tool.name === 'studio.engineering.execute'");
    expect(executor).toContain(
      "@/apps/admin/app/api/admin/dev-studio/engineering/route",
    );
    expect(planner).toContain(
      "/\\bopenhands\\b/.test(lower) ? 'openhands.execute' : 'studio.engineering.execute'",
    );
  });
});
