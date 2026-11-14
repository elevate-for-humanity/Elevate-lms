import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { isParisProviderBranchCandidate } from '../../lib/devstudio/openhands/paris-provider-candidate';

const repairId = '103a1188-e359-40e2-8dce-5ff6b85b4b5a';
const branch = `studio/paris-openhands-${repairId}-1`;
const repo = 'elevate-for-humanity/Elevate-lms';
const startTaskId = 'dac2ccfbdf3a4e43b3e766d88c292046';

function fixture() {
  return {
    task: {
      tool_name: 'openhands.execute', user_id: 'authorized-owner',
      tenant_id: null, correlation_id: `paris-repair:${repairId}:attempt:1`,
      requires_approval: false, approval_status: 'not_required',
      command: `PARIS owner-authorized engineering repair ${repairId}.\nRepository: ${repo}. Immutable base: ${'a'.repeat(40)}.\nUse ONLY branch ${branch}, already created at that base.\nDo not open a PR or claim publication: PARIS independently reads back the exact commits`,
      tool_input: { repository: repo, branch },
      tool_output: { start_task_id: startTaskId },
    },
    lifecycle: {
      status: 'completed', startTaskId, repository: repo, branch, prNumbers: [],
    },
    github: {
      verified: false, repository: repo,
      branch: { name: branch, sha: 'b'.repeat(40) },
      pullRequests: [], reasons: ['PARIS retains independent publication authority'],
    },
  };
}

describe('PARIS provider stage is distinct from final OpenHands/PR/CI acceptance', () => {
  it('recognizes only the owned, approved-source branch as a candidate for PARIS validation', () => {
    const f = fixture();
    expect(isParisProviderBranchCandidate(f.task, f.lifecycle, f.github)).toBe(true);
  });

  it('rejects nonterminal provider results, missing GitHub branches, and unrelated PR claims', () => {
    const f = fixture();
    expect(isParisProviderBranchCandidate(f.task, { ...f.lifecycle, status: 'running' }, f.github)).toBe(false);
    expect(isParisProviderBranchCandidate(f.task, f.lifecycle, { ...f.github, branch: null })).toBe(false);
    expect(isParisProviderBranchCandidate(f.task, f.lifecycle, { ...f.github, branch: {name: branch, sha: 'short'} })).toBe(false);
    expect(isParisProviderBranchCandidate(f.task, f.lifecycle, { ...f.github, verified: true })).toBe(false);
    expect(isParisProviderBranchCandidate(f.task, f.lifecycle, { ...f.github, pullRequests: [{
      number: 2541, state: 'open', draft: false, merged: false,
      headSha: 'b'.repeat(40), headRef: branch, baseRef: 'main',
      changedFiles: ['lib/example.ts'], combinedStatus: 'pending', checkRuns: [],
    }] })).toBe(false);
    expect(isParisProviderBranchCandidate(f.task, { ...f.lifecycle, prNumbers: [2541] }, f.github)).toBe(false);
  });

  it('never accepts missing receipt, wrong repo/branch/owner, or approval-gated tasks', () => {
    const f = fixture();
    for (const task of [
      { ...f.task, tool_name: 'openhands.status' },
      { ...f.task, user_id: null },
      { ...f.task, tenant_id: 'other-tenant' },
      { ...f.task, approval_status: 'pending', requires_approval: true },
      { ...f.task, approval_status: 'rejected', requires_approval: true },
      { ...f.task, requires_approval: true },
      { ...f.task, correlation_id: 'random-unrelated-task' },
      { ...f.task, command: 'Spoofed repair' },
      { ...f.task, tool_input: { repository: 'other/repo', branch } },
      { ...f.task, tool_input: { repository: repo, branch: 'main' } },
      { ...f.task, tool_output: {} },
    ]) {
      expect(isParisProviderBranchCandidate(task, f.lifecycle, f.github)).toBe(false);
    }
    expect(isParisProviderBranchCandidate(f.task, { ...f.lifecycle, startTaskId: 'different' }, f.github)).toBe(false);
    expect(isParisProviderBranchCandidate(f.task, { ...f.lifecycle, branch: 'main' }, f.github)).toBe(false);
    expect(isParisProviderBranchCandidate(f.task, f.lifecycle, { ...f.github, repository: 'other/repo' })).toBe(false);
  });

  it('accepts recorded owner approval for terminal inspection but never a still-gated task', () => {
    const f = fixture();
    expect(isParisProviderBranchCandidate(
      { ...f.task, approval_status: 'approved', requires_approval: true, status: 'running' },
      f.lifecycle, f.github,
    )).toBe(true);
    expect(isParisProviderBranchCandidate(
      { ...f.task, approval_status: 'approved', requires_approval: true, status: 'awaiting_approval' },
      f.lifecycle, f.github,
    )).toBe(false);
    expect(isParisProviderBranchCandidate(
      { ...f.task, approval_status: 'pending', requires_approval: true, status: 'running' },
      f.lifecycle, f.github,
    )).toBe(false);
  });

  it('wires candidate to running/pending rather than completed or fabricated human approval', () => {
    const source = readFileSync(path.join(process.cwd(), 'lib/devstudio/openhands/runtime.ts'), 'utf8');
    expect(source).toMatch(/const parisProviderCandidatePendingValidation\s*=\s*evaluation\.status === 'REQUIRES_HUMAN_REVIEW'\s*&&\s*isParisProviderBranchCandidate\(task, lifecycle, githubEvidence\)/);
    expect(source).toMatch(/!verificationStillRunning && !parisProviderCandidatePendingValidation/);
    expect(source).toMatch(/executionStillRunning \|\| parisProviderCandidatePendingValidation\s*\? 'running'/);
    expect(source).toMatch(/paris_provider_candidate_pending_validation: parisProviderCandidatePendingValidation/);
    expect(source).toMatch(/evaluation\.status === 'PASS'\s*\? 'completed'/);
  });
});
