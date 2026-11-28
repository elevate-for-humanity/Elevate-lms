// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { quickBooksRequest } from '@/lib/integrations/quickbooks-client';

// Pins the 2026-11-28 QuickBooks diagnosability fix: when Intuit rejects a
// request, the Fault detail (code + message) must survive into the thrown
// error so it lands in billing_invoices.provider_payload and the logs.
// Before this, every failure was recorded as a bare
// "QuickBooks request failed (400)." with no actionable cause.
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: vi.fn().mockResolvedValue(undefined) }));

const config = { clientId: 'app', clientSecret: 'secret', accessToken: 'access', refreshToken: 'refresh', realmId: 'company' };

beforeEach(() => { vi.stubEnv('QB_ENVIRONMENT', 'production'); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('QuickBooks fault surfacing', () => {
  it('includes the Intuit fault code and message on a 400', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ Fault: { Error: [{ code: '6240', Message: 'Duplicate Name Exists Error', Detail: 'The name supplied already exists.' }] } }),
    }));
    await expect(quickBooksRequest({}, config, 'customer')).rejects.toThrow(/6240/);
    await expect(quickBooksRequest({}, config, 'customer')).rejects.toThrow(/Duplicate Name Exists Error/);
  });

  it('still throws a status-bearing error when Intuit returns no fault body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => { throw new Error('not json'); },
    }));
    await expect(quickBooksRequest({}, config, 'invoice')).rejects.toThrow(/QuickBooks request failed \(400\)/);
  });
});
