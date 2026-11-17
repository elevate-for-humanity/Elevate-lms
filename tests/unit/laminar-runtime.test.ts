import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ read: vi.fn(), initialize: vi.fn() }));
vi.mock('../../lib/secrets', () => ({ getSelectedRuntimeSecrets: mocks.read }));
vi.mock('../../lib/observability/laminar', () => ({ initializeLaminar: mocks.initialize }));
import { initializeLaminar } from '../../lib/observability/laminar-runtime';

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('LMNR_PROJECT_API_KEY', '');
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe('Laminar deployed runtime credential', () => {
  it('loads only its own key through the existing restricted secret source', async () => {
    mocks.read.mockResolvedValue({ LMNR_PROJECT_API_KEY: '  fixture-vault-key  ' });
    await initializeLaminar('admin');
    expect(mocks.read).toHaveBeenCalledExactlyOnceWith(['LMNR_PROJECT_API_KEY'], { signal: expect.any(AbortSignal) });
    expect(process.env.LMNR_PROJECT_API_KEY).toBe('fixture-vault-key');
    expect(mocks.initialize).toHaveBeenCalledExactlyOnceWith('admin');
  });
  it('preserves a credential bound by the container', async () => {
    vi.stubEnv('LMNR_PROJECT_API_KEY', 'fixture-container-key');
    await initializeLaminar('lms');
    expect(mocks.read).not.toHaveBeenCalled();
    expect(process.env.LMNR_PROJECT_API_KEY).toBe('fixture-container-key');
    expect(mocks.initialize).toHaveBeenCalledExactlyOnceWith('lms');
  });
  it('continues startup without logging a rejected secret response', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mocks.read.mockRejectedValue(new Error('private-secret-response'));
    await initializeLaminar('marketing');
    expect(mocks.initialize).toHaveBeenCalledExactlyOnceWith('marketing');
    expect(JSON.stringify(warn.mock.calls)).not.toContain('private-secret-response');
  });
  it('keeps the credential unset when its source has no value', async () => {
    mocks.read.mockResolvedValue({});
    await initializeLaminar();
    expect(process.env.LMNR_PROJECT_API_KEY).toBe('');
    expect(mocks.initialize).toHaveBeenCalledTimes(1);
  });
  it('leaves local development credential loading to the local project helper', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    await initializeLaminar('marketing');
    expect(mocks.read).not.toHaveBeenCalled();
    expect(mocks.initialize).toHaveBeenCalledExactlyOnceWith('marketing');
  });
});
