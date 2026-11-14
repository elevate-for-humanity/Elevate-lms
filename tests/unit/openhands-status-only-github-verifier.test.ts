import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const keys = vi.hoisted(() => ({ repo: vi.fn(), app: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/secrets', () => ({ getSecret: vi.fn() }));
vi.mock('@/lib/devstudio/github-token', () => ({ getGitHubToken: keys.repo }));
vi.mock('@/lib/devstudio/github-app-token', () => ({ getGitHubAppToken: keys.app }));
import { verifyOpenHandsGitHubOutcome } from '@/lib/devstudio/openhands/github-verifier';

const HEAD = 'a'.repeat(40), MERGE = 'b'.repeat(40);
const origin = 'https://api.github.com';
const prefix = '/repos/elevate-for-humanity/Elevate-lms';
const fixtures: Record<string, unknown> = {
  [`${prefix}/branches/openhands/status-only`]: { name: 'openhands/status-only', commit: { sha: HEAD } },
  [`${prefix}/pulls/42`]: {
    number: 42, state: 'closed', merged: true, merged_at: '2026-11-14T02:00:00Z',
    merge_commit_sha: MERGE, created_at: '2026-11-14T00:00:00Z',
    user: { login: 'author' }, head: { ref: 'openhands/status-only', sha: HEAD }, base: { ref: 'main' },
  },
  [`${prefix}/pulls/42/files?per_page=100`]: [{ filename: 'lib/devstudio/openhands/runtime.ts' }],
  [`${prefix}/commits/${HEAD}/status`]: { state: 'success' },
  [`${prefix}/commits/${HEAD}/statuses?per_page=100`]: [{ context: 'external-ci', state: 'success' }],
  [`${prefix}/commits/${HEAD}/check-runs?per_page=100`]: { check_runs: [] },
  [`${prefix}/pulls/42/reviews?per_page=100`]: [{
    user: { login: 'independent', type: 'User' }, state: 'APPROVED',
    commit_id: HEAD, submitted_at: '2026-11-14T01:00:00Z',
  }],
  [`${prefix}/compare/${MERGE}...main`]: { status: 'ahead' },
  [`${prefix}/rules/branches/main`]: [
    { type: 'pull_request', parameters: { required_approving_review_count: 1 } },
    { type: 'required_status_checks', parameters: {
      required_status_checks: [{ context: 'external-ci' }],
    } },
  ],
  [`${prefix}/branches/main/protection`]: { required_pull_request_reviews: {
    required_approving_review_count: 1,
  } },
};
const originalFetch = globalThis.fetch;
const originalRepo = process.env.OPENHANDS_REPOSITORY;

beforeEach(() => {
  vi.resetAllMocks();
  keys.repo.mockResolvedValue('test-github-read-token');
  keys.app.mockResolvedValue('test-github-app-token');
  process.env.OPENHANDS_REPOSITORY = 'elevate-for-humanity/Elevate-lms';
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalRepo === undefined) delete process.env.OPENHANDS_REPOSITORY;
  else process.env.OPENHANDS_REPOSITORY = originalRepo;
});

function mockGitHub(overrides: Record<string, unknown> = {}) {
  const map = { ...fixtures, ...overrides };
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const path = String(input).replace(origin, '');
    if (!(path in map)) return new Response('not found', { status: 404 });
    return new Response(JSON.stringify(map[path]), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
}

const request = { repository: 'elevate-for-humanity/Elevate-lms',
  branch: 'openhands/status-only', prNumbers: [42], startedAt: '2026-11-13T00:00:00Z' };

describe('OpenHands independent GitHub verification — status-only CI', () => {
  it('verifies exact-head PR with required commit status and no check runs', async () => {
    mockGitHub();
    const result = await verifyOpenHandsGitHubOutcome(request);
    expect(result.verified).toBe(true);
    expect(result.pullRequests[0].headSha).toBe(HEAD);
    expect(keys.app).toHaveBeenCalled();
  });
  it('rejects failed legacy commit status even when PR exists', async () => {
    mockGitHub({ [`${prefix}/commits/${HEAD}/statuses?per_page=100`]: [{
      context: 'external-ci', state: 'failure',
    }] });
    expect((await verifyOpenHandsGitHubOutcome(request)).verified).toBe(false);
  });
  it('rejects skipped required check run even when same status context succeeds', async () => {
    mockGitHub({ [`${prefix}/commits/${HEAD}/check-runs?per_page=100`]: {
      check_runs: [{ name: 'external-ci', status: 'completed', conclusion: 'skipped' }],
    } });
    expect((await verifyOpenHandsGitHubOutcome(request)).verified).toBe(false);
  });
});
