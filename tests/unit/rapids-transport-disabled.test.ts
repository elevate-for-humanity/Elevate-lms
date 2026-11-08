import { afterEach, expect, it, vi } from 'vitest';
import { rapidsService } from '../../lib/rapids/rapids-sync';
import type { ApprenticeData, RAPIDSHoursUpdate } from '../../lib/rapids/rapids-sync';
import type { SupabaseClient } from '../../lib/supabase';

afterEach(() => vi.unstubAllGlobals());

it('cannot send registrations, hours, or completions even after legacy configuration', async () => {
  const network = vi.fn().mockRejectedValue(new Error('Unexpected agency request'));
  vi.stubGlobal('fetch', network);
  rapidsService.configure({ agencyId: 'test', apiKey: 'test', baseUrl: 'https://unverified.invalid' });
  const results = await Promise.all([
    rapidsService.registerApprentice({} as ApprenticeData),
    rapidsService.submitHours({} as RAPIDSHoursUpdate),
    rapidsService.completeApprentice('test-apprentice', '2026-11-07'),
  ]);
  for (const result of results) {
    expect(result).toMatchObject({ success: false, error: expect.stringContaining('RAPIDS_MANUAL_SUBMISSION_REQUIRED') });
    expect(result).not.toHaveProperty('rapidsId');
    expect(result).not.toHaveProperty('registeredAt');
  }
  expect(network).not.toHaveBeenCalled();
});

it('blocks batch sync without reading personal records or writing agency registration status', async () => {
  const from = vi.fn(() => { throw new Error('Unexpected database access'); });
  const result = await rapidsService.syncPendingEnrollments({ from } as unknown as SupabaseClient);
  expect(result).toMatchObject({ synced: 0, failed: 0, blocked: true, error: expect.stringContaining('RAPIDS_MANUAL_SUBMISSION_REQUIRED') });
  expect(from).not.toHaveBeenCalled();
});
