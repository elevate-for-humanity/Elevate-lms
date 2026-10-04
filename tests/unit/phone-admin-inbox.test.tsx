import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { holderCallOutcome, loadPhoneInbox, resolvePhoneInboxScope } from '@/apps/admin/app/phone/inbox/data';

const mocks = vi.hoisted(() => ({ db: null as any, auth: null as any }));
vi.mock('@/lib/auth/require-role', () => ({ requireRole: async () => mocks.auth }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => mocks.db }));
import PhoneInboxPage from '@/apps/admin/app/phone/inbox/page';

let tables: Record<string, any[]>;
let failure = '';
function query(table: string) {
  const filters: Array<(row: any) => boolean> = [];
  let first = false;
  let start = 0;
  let end = Infinity;
  const value = (row: any, key: string) => key.split('.').reduce((v, k) => v?.[k], row);
  const q: any = {
    select: () => q,
    eq: (key: string, expected: any) => { filters.push(row => value(row, key) === expected); return q; },
    is: (key: string, expected: any) => { filters.push(row => value(row, key) === expected); return q; },
    order: () => q, limit: () => q,
    range: (a: number, b: number) => { start = a; end = b + 1; return q; },
    maybeSingle: () => { first = true; return q; },
    then: (resolve: any, reject: any) => {
      const rows = (tables[table] || []).filter(r => filters.every(f => f(r))).slice(start, end);
      return Promise.resolve({ data: first ? rows[0] || null : rows, error: failure === table ? new Error('database unavailable') : null }).then(resolve, reject);
    },
  };
  return q;
}

beforeEach(() => {
  failure = '';
  mocks.db = { from: query };
  mocks.auth = { user: { id: 'admin' }, profile: { tenant_id: 'admin-tenant' }, effectiveRoles: ['admin'] };
  const extension = { extension: '105', display_name: 'Josanna George' };
  tables = {
    phone_systems: [{ id: 'system', tenant_id: null }],
    communication_workspaces: [{ id: 'workspace', phone_system_id: 'system' }],
    phone_calls: [{ id: 'call', phone_system_id: 'system', assigned_profile_id: 'holder', extension, from_number: '+13175550100', to_number: '+13179999620', direction: 'inbound', started_at: '2026-10-04T12:00:00Z', ended_at: '2026-10-04T12:01:00Z', legs: [], callbacks: [{ id: 'task', source: 'voicemail', status: 'contacted' }] }],
    phone_callback_tasks: [{ id: 'task', assigned_profile_id: 'holder', call_id: 'call', call: { phone_system_id: 'system', started_at: '2026-10-04T12:00:00Z' }, extension, callback_number: '+13175550100', status: 'contacted', transcript: 'Please call me about esthetician training.' }],
    voicemails: [{ id: 'vm', phone_system_id: 'system', assigned_profile_id: 'holder', call_id: 'call', extension, phone_number: '+13175550100', recording_url: 'https://example.test/message.mp3' }],
    communication_messages: [{ id: 'sms', workspace_id: 'other-workspace', channel: 'sms', body: 'Other tenant' }],
  };
});

describe('Admin call and voicemail oversight', () => {
  it('loads holder callbacks through their call system, not a nonexistent task column', async () => {
    const data = await loadPhoneInbox(mocks.db, { systemId: 'system' });
    expect(data.callbacks).toHaveLength(1);
    expect(data.calls).toHaveLength(1);
    expect(data.voicemails[0].call_id).toBe(data.calls[0].id);
    expect(data.texts).toEqual([]);
  });
  it('keeps other holders and systems out of a non-admin inbox', async () => {
    const data = await loadPhoneInbox(mocks.db, { systemId: 'system', profileId: 'different-holder' });
    expect(data.calls).toEqual([]);
    expect(data.callbacks).toEqual([]);
    expect(data.voicemails).toEqual([]);
  });
  it('allows platform Admin fallback but not an organization admin to see the platform system', async () => {
    expect((await resolvePhoneInboxScope(mocks.db, mocks.auth)).systemId).toBe('system');
    mocks.auth.effectiveRoles = ['org_admin'];
    expect((await resolvePhoneInboxScope(mocks.db, mocks.auth)).systemId).toBeUndefined();
  });
  it('does not mistake PARIS answering for the holder answering', () => {
    expect(holderCallOutcome({ ...tables.phone_calls[0], answered_at: '2026-10-04T12:00:01Z' })).toBe('No holder answer recorded');
    expect(holderCallOutcome({ ...tables.phone_calls[0], legs: [{ answered_at: '2026-10-04T12:00:05Z' }] })).toBe('Answered by staff');
  });
  it('surfaces retrieval errors instead of falsely reporting no callbacks', async () => {
    failure = 'phone_callback_tasks';
    await expect(loadPhoneInbox(mocks.db, { systemId: 'system' })).rejects.toThrow('database unavailable');
  });
  it('makes older call records accessible through pagination', async () => {
    tables.phone_calls = Array.from({ length: 52 }, (_, n) => ({ ...tables.phone_calls[0], id: String(n) }));
    expect((await loadPhoneInbox(mocks.db, { systemId: 'system' }, 1)).hasMore).toBe(true);
    const next = await loadPhoneInbox(mocks.db, { systemId: 'system' }, 2);
    expect(next.calls.map((c: any) => c.id)).toEqual(['50', '51']);
    expect(next.hasMore).toBe(false);
  });
  it('renders the caller, responsible holder, recording, transcript and shared callback status', async () => {
    const html = renderToStaticMarkup(await PhoneInboxPage({}));
    for (const expected of ['Josanna George', '+13175550100', 'contacted', 'Please call me about esthetician', 'message.mp3', 'Linked call:']) expect(html).toContain(expected);
    expect(html).toContain('assigned program holder remains responsible');
    expect(html).not.toContain('Other tenant');
  });
});
