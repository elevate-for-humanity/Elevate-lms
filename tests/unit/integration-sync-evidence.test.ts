// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { summarizeSyncEvidence } from '@/lib/integrations/sync-evidence';
import { RUNTIME_INTEGRATIONS, runtimeConfiguration } from '@/lib/integrations/runtime-status';
vi.mock('server-only', () => ({}));
import { telnyxClient } from '@/lib/phone/telnyx';
import { GET } from '@/apps/admin/app/api/health/telnyx/route';

const timestamp = '2026-11-01T05:00:00Z';
describe('integration evidence boundaries', () => {
  it('registers all required services once and excludes retired providers', () => {
    const ids = RUNTIME_INTEGRATIONS.map((item) => item.id);
    expect(new Set(ids).size).toBe(20);
    expect(ids).not.toContain('stripe');
    expect(ids).not.toContain('telnyx');
    expect(runtimeConfiguration('unknown').configured).toBe(false);
  });
  it('does not count provider reads, failed writes, or configuration edits as sync', () => {
    expect(summarizeSyncEvidence([
      { action: 'sync_payroll', status: 'success', records: 100, created_at: timestamp },
      { action: 'sync', status: 'failed', records: { operation: 'synchronize', committed: true, contacts: 3, leads: 2 }, created_at: timestamp },
    ])).toEqual({ last_sync: null, contacts: null, leads: null });
  });
  it('counts only a committed synchronization receipt', () => {
    expect(summarizeSyncEvidence([
      { action: 'sync', status: 'success', records: { operation: 'synchronize', committed: true, contacts: 3, leads: 2 }, created_at: timestamp },
    ])).toEqual({ last_sync: timestamp, contacts: 3, leads: 2 });
  });
  it('rejects malformed receipts', () => {
    for (const contacts of [-1, 0.5, NaN, '3']) {
      expect(summarizeSyncEvidence([{ action: 'sync', status: 'success', records: { operation: 'synchronize', committed: true, contacts, leads: 0 }, created_at: timestamp }]).last_sync).toBeNull();
    }
  });
  it('cannot execute Telnyx, even when legacy credentials exist', async () => {
    await expect(telnyxClient()).rejects.toThrow('Telnyx is retired');
    const response = await GET();
    expect(response.status).toBe(410);
    expect(await response.json()).toMatchObject({ ready: false, retired: true });
  });
});
