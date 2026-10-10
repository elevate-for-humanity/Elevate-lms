import { afterEach, describe, expect, it, vi } from 'vitest';
const token = vi.hoisted(() => vi.fn());
vi.mock('@/lib/devstudio/github-token', () => ({ getGitHubToken: token }));
import { dispatchGoogleDeployment, isGoogleDeploymentConfigured } from '@/lib/gcp/dispatch-production-workflow';
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe('Google production dispatch', () => {
  it('dispatches LMS main to its self-building Google workflow with the resolved token', async () => {
    token.mockResolvedValue('resolved-test-token'); const request = vi.fn().mockResolvedValue(new Response(null,{status:204})); vi.stubGlobal('fetch',request);
    const result = await dispatchGoogleDeployment('lms');
    expect(request.mock.calls[0][0]).toBe('https://api.github.com/repos/elevate-for-humanity/Elevate-lms/actions/workflows/deploy-google-lms-trigger.yml/dispatches');
    expect(JSON.parse(request.mock.calls[0][1].body)).toEqual({ref:'main'});
    expect(request.mock.calls[0][1].headers.Authorization).toBe('Bearer resolved-test-token');
    expect(result.verifiedLive).toBe(false);
  });
  it('does not send a deployment request without a resolved credential', async () => {
    token.mockResolvedValue(null); const request=vi.fn(); vi.stubGlobal('fetch',request);
    expect(await isGoogleDeploymentConfigured()).toBe(false);
    await expect(dispatchGoogleDeployment('admin')).rejects.toThrow('token is not configured'); expect(request).not.toHaveBeenCalled();
  });
  it('does not report a refused dispatch as a successful release', async () => {
    token.mockResolvedValue('resolved-test-token'); vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(null,{status:403})));
    await expect(dispatchGoogleDeployment('admin')).rejects.toThrow('HTTP 403');
  });
});
