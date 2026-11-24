import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
});

vi.mock('server-only', () => ({}));

vi.mock('@/lib/devstudio/github-token', () => ({
  getGitHubHeaders: vi.fn(async () => ({
    Authorization: 'Bearer test-token',
    Accept: 'application/vnd.github+json',
  })),
}));

import {
  planMuseLoop,
  runMuseLoop,
  validateMuseLoopInput,
  type MuseLoopInput,
} from '../../../lib/devstudio/muse-loop';

const BASE_INPUT: MuseLoopInput = {
  branch: 'studio/fix-test-loop',
  title: 'test: prove the Muse loop',
  body: 'A small test change driven from Dev Studio.',
  message: 'test: prove the Muse loop',
  files: [{ path: 'docs/muse-loop-proof.md', content: '# proof\n' }],
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function mockGitHub() {
  const calls: string[] = [];
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    calls.push(`${method} ${url}`);
    if (url.endsWith('/git/ref/heads/main')) {
      return jsonResponse({ object: { sha: 'a'.repeat(40) } });
    }
    if (url.endsWith('/git/ref/heads/studio%2Ffix-test-loop')) {
      return jsonResponse({ message: 'Not Found' }, 404);
    }
    if (url.endsWith('/git/refs') && method === 'POST') {
      return jsonResponse({ ref: 'refs/heads/studio/fix-test-loop' }, 201);
    }
    if (url.endsWith('/git/blobs')) {
      return jsonResponse({ sha: 'b'.repeat(40) }, 201);
    }
    if (url.endsWith('/git/trees')) {
      return jsonResponse({ sha: 'c'.repeat(40) }, 201);
    }
    if (url.endsWith('/git/commits') && method === 'POST') {
      return jsonResponse({ sha: 'd'.repeat(40) }, 201);
    }
    if (url.includes('/git/refs/heads/studio%2Ffix-test-loop') && method === 'PATCH') {
      return jsonResponse({ ref: 'refs/heads/studio/fix-test-loop' });
    }
    if (url.endsWith('/pulls') && method === 'POST') {
      return jsonResponse(
        { number: 9999, html_url: 'https://github.com/elevate-for-humanity/Elevate-lms/pull/9999' },
        201,
      );
    }
    if (url.includes('/status')) {
      return jsonResponse({ state: 'success' });
    }
    if (url.includes('/check-runs')) {
      return jsonResponse({ check_runs: [{ conclusion: 'success' }] });
    }
    return jsonResponse({ message: `unexpected ${method} ${url}` }, 500);
  });
  vi.spyOn(globalThis, 'fetch').mockImplementation(fetchMock as typeof fetch);
  return { calls, fetchMock };
}

describe('planMuseLoop', () => {
  it('plans the five loop steps without any GitHub calls', () => {
    const steps = planMuseLoop(BASE_INPUT);
    expect(steps.map((step) => step.step)).toEqual([
      'read-base',
      'create-branch',
      'commit-files',
      'open-pr',
      'check-ci',
    ]);
  });

  it('refuses to target main', () => {
    expect(validateMuseLoopInput({ ...BASE_INPUT, branch: 'main' })).toContain(
      'MUSE_LOOP_BRANCH_MUST_NOT_BE_BASE',
    );
  });

  it('refuses secret paths', () => {
    expect(
      validateMuseLoopInput({
        ...BASE_INPUT,
        files: [{ path: '.env', content: 'x' }],
      }),
    ).toContain('MUSE_LOOP_BLOCKED_PATH:.env');
    expect(
      validateMuseLoopInput({
        ...BASE_INPUT,
        files: [{ path: 'keys/app.pem', content: 'x' }],
      }),
    ).toContain('MUSE_LOOP_BLOCKED_PATH:keys/app.pem');
  });
});

describe('runMuseLoop', () => {
  it('runs branch -> commit -> PR -> CI check and reports the PR', async () => {
    mockGitHub();
    const result = await runMuseLoop(BASE_INPUT);
    expect(result.repository).toBe('elevate-for-humanity/Elevate-lms');
    expect(result.branch).toBe('studio/fix-test-loop');
    expect(result.baseSha).toBe('a'.repeat(40));
    expect(result.headSha).toBe('d'.repeat(40));
    expect(result.prNumber).toBe(9999);
    expect(result.prUrl).toContain('/pull/9999');
    expect(result.checks.state).toBe('success');
  });

  it('fails closed when the branch already exists', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((async (url: string) => {
      if (url.endsWith('/git/ref/heads/main')) {
        return jsonResponse({ object: { sha: 'a'.repeat(40) } });
      }
      if (url.endsWith('/git/ref/heads/studio%2Ffix-test-loop')) {
        return jsonResponse({ object: { sha: 'e'.repeat(40) } });
      }
      return jsonResponse({ message: 'unexpected' }, 500);
    }) as typeof fetch);
    await expect(runMuseLoop(BASE_INPUT)).rejects.toThrow('MUSE_LOOP_BRANCH_ALREADY_EXISTS');
  });

  it('fails closed with the GitHub status when PR creation is forbidden', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((async (url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      if (url.endsWith('/git/ref/heads/main')) {
        return jsonResponse({ object: { sha: 'a'.repeat(40) } });
      }
      if (url.endsWith('/git/ref/heads/studio%2Ffix-test-loop')) {
        return jsonResponse({ message: 'Not Found' }, 404);
      }
      if (url.endsWith('/git/refs') && method === 'POST') {
        return jsonResponse({ ref: 'refs/heads/studio/fix-test-loop' }, 201);
      }
      if (url.endsWith('/git/blobs')) return jsonResponse({ sha: 'b'.repeat(40) }, 201);
      if (url.endsWith('/git/trees')) return jsonResponse({ sha: 'c'.repeat(40) }, 201);
      if (url.endsWith('/git/commits') && method === 'POST') {
        return jsonResponse({ sha: 'd'.repeat(40) }, 201);
      }
      if (url.includes('/git/refs/heads/') && method === 'PATCH') {
        return jsonResponse({ ref: 'refs/heads/studio/fix-test-loop' });
      }
      if (url.endsWith('/pulls')) return jsonResponse({ message: 'Forbidden' }, 403);
      return jsonResponse({ message: 'unexpected' }, 500);
    }) as typeof fetch);
    await expect(runMuseLoop(BASE_INPUT)).rejects.toThrow('MUSE_LOOP_GITHUB_HTTP_403');
  });
});
