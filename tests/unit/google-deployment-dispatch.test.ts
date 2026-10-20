import { afterEach, describe, expect, it, vi } from 'vitest';
const token = vi.hoisted(() => vi.fn());
vi.mock('@/lib/devstudio/github-token', () => ({ getGitHubTokenCandidates: token }));
import {
  dispatchGoogleDeployment,
  isGoogleDeploymentConfigured,
} from '@/lib/gcp/dispatch-production-workflow';
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe('Google production dispatch', () => {
  it('dispatches LMS main to its self-building Google workflow with the resolved token', async () => {
    token.mockResolvedValue(['resolved-test-token']);
    const request = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', request);
    const result = await dispatchGoogleDeployment('lms');
    expect(request.mock.calls[0][0]).toBe(
      'https://api.github.com/repos/elevate-for-humanity/Elevate-lms/actions/workflows/deploy-google-lms-trigger.yml/dispatches',
    );
    expect(JSON.parse(request.mock.calls[0][1].body)).toEqual({ ref: 'main' });
    expect(request.mock.calls[0][1].headers.Authorization).toBe('Bearer resolved-test-token');
    expect(result.verifiedLive).toBe(false);
  });
  it('does not send a deployment request without a resolved credential', async () => {
    token.mockResolvedValue([]);
    const request = vi.fn();
    vi.stubGlobal('fetch', request);
    expect(await isGoogleDeploymentConfigured()).toBe(false);
    await expect(dispatchGoogleDeployment('admin')).rejects.toThrow('token is not configured');
    expect(request).not.toHaveBeenCalled();
  });
  it('does not report a refused dispatch as a successful release', async () => {
    token.mockResolvedValue(['resolved-test-token']);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 403 })));
    await expect(dispatchGoogleDeployment('admin')).rejects.toThrow('HTTP 403');
  });
  it('falls back to the next existing credential after an authentication rejection', async () => {
    token.mockResolvedValue(['expired-test-token', 'resolved-test-token']);
    const request = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', request);
    expect((await dispatchGoogleDeployment('admin')).status).toBe('dispatched');
    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[1][1].headers.Authorization).toBe('Bearer resolved-test-token');
  });
  it('does not retry an ambiguous provider failure with another credential', async () => {
    token.mockResolvedValue(['first-test-token', 'second-test-token']);
    const request = vi.fn().mockResolvedValue(new Response(null, { status: 503 }));
    vi.stubGlobal('fetch', request);
    await expect(dispatchGoogleDeployment('admin')).rejects.toThrow('HTTP 503');
    expect(request).toHaveBeenCalledTimes(1);
  });
  it.each([401, 403, 404, 503])(
    'does not advertise a rejected workflow probe (%s) as configured',
    async (status) => {
      token.mockResolvedValue(['resolved-test-token']);
      const request = vi.fn().mockResolvedValue(new Response(null, { status }));
      vi.stubGlobal('fetch', request);
      expect(await isGoogleDeploymentConfigured()).toBe(false);
      expect(request.mock.calls[0][1].method).toBeUndefined();
    },
  );
  it.each(['active', 'disabled_manually'])(
    'requires an active reachable workflow: %s',
    async (state) => {
      token.mockResolvedValue(['resolved-test-token']);
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ state })));
      expect(await isGoogleDeploymentConfigured()).toBe(state === 'active');
    },
  );
  it('dispatches Store to its Google runtime workflow without claiming deployment success', async () => {
    token.mockResolvedValue(['resolved-test-token']);
    const request = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', request);
    expect((await dispatchGoogleDeployment('store')).verifiedLive).toBe(false);
    expect(request.mock.calls[0][0]).toContain('/deploy-google-store-runtime.yml/dispatches');
  });
});
