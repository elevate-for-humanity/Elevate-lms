// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
const token = vi.hoisted(() => vi.fn());
vi.mock('@/lib/devstudio/github-token', () => ({ getGitHubToken: token }));
import { getRepositoryHealth } from '@/lib/devstudio/repository-health';
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

it('uses the canonical App/workflow/runtime identity and validates the actual repository ref', async () => {
  token.mockResolvedValue('private-installation-token');
  const request = vi.fn().mockResolvedValue(Response.json({ object: { sha: 'a'.repeat(40) } }));
  vi.stubGlobal('fetch', request);
  const result = await getRepositoryHealth();
  expect(result.status).toBe('healthy');
  expect(request).toHaveBeenCalledWith(expect.stringContaining('/Elevate-lms/git/ref/heads/main'),
    expect.objectContaining({ redirect: 'error', cache: 'no-store', signal: expect.any(AbortSignal) }));
  expect(JSON.stringify(result)).not.toContain('private-installation-token');
});

it.each([401, 403, 404, 429, 503])('fails closed for rejected or unavailable repository access (HTTP %s)', async status => {
  token.mockResolvedValue('private-token');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: 'private-error' }, { status })));
  const result = await getRepositoryHealth();
  expect(result.status).toBe('unavailable');
  expect(JSON.stringify(result)).not.toContain('private-');
});

it('does not treat missing credentials, malformed responses, or resolver errors as healthy', async () => {
  token.mockResolvedValue(null);
  const request = vi.fn(); vi.stubGlobal('fetch', request);
  expect((await getRepositoryHealth()).status).toBe('unavailable');
  expect(request).not.toHaveBeenCalled();
  token.mockResolvedValue('private-token');
  request.mockResolvedValue(Response.json({ object: { sha: 'not-a-commit' } }));
  expect((await getRepositoryHealth()).status).toBe('unavailable');
  token.mockRejectedValue(new Error('private-runtime-error'));
  expect(JSON.stringify(await getRepositoryHealth())).not.toContain('private-runtime-error');
});
