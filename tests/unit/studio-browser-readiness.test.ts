import { describe, expect, it } from 'vitest';
import { describeBrowserReadiness } from '@/lib/devstudio/browser-readiness';

const healthy = {
  service: 'studio-browser',
  engine: 'direct-cdp-chromium',
  ok: true,
  ready: true,
  browserConnected: true,
  browserState: 'ready',
  providerAuthStorage: { ready: true },
  terminalRecovery: { ready: true },
  browserWorkspaceRecovery: { ready: true },
  workspaceRecovery: { ready: true, storage: { ready: true } },
};
describe('Studio runtime readiness contract', () => {
  it('accepts the serving browser contract while distinguishing unreported recovery from failure', () => {
    const { terminalRecovery, browserWorkspaceRecovery, workspaceRecovery, ...deployed } = healthy;
    expect(
      describeBrowserReadiness(true, {
        ...deployed,
        activeSessions: 4,
        maxSessions: 4,
        admissionAvailable: false,
      }),
    ).toEqual({
      ready: true,
      detail: expect.stringContaining(
        'recovery not reported: terminal recovery, browser session storage, repository recovery',
      ),
    });
  });
  it('accepts a complete runtime report without claiming functional acceptance', () => {
    expect(describeBrowserReadiness(true, healthy)).toEqual({
      ready: true,
      detail: expect.stringContaining('still require functional verification'),
    });
  });
  it.each([
    null,
    {},
    { ...healthy, service: 'marketing' },
    { ...healthy, ready: false },
    { ...healthy, ok: false },
    { ...healthy, browserConnected: false },
    { ...healthy, browserState: 'restarting' },
  ])('rejects invalid or mismatched readiness', (body) => {
    expect(describeBrowserReadiness(true, body).ready).toBe(false);
  });
  it('does not accept an HTTP failure with a healthy-looking body', () => {
    expect(describeBrowserReadiness(false, healthy).ready).toBe(false);
  });
  it('identifies the failed capability without echoing upstream secrets or paths', () => {
    const result = describeBrowserReadiness(true, {
      ...healthy,
      workspaceRecovery: {
        ready: true,
        lastSaveError: 'secret=private',
        storage: { ready: false },
      },
      terminalRecovery: { ready: false },
    });
    expect(result).toEqual({
      ready: false,
      detail: 'Studio runtime is not ready: terminal recovery, repository recovery',
    });
    expect(result.detail).not.toContain('private');
  });
});
