import { describe, expect, it } from 'vitest';
import { storeSmsEvent } from '@/lib/phone/sms-inbound';

/**
 * The inbound-text thread owner of last resort is the operator: the
 * extension row the phone system designates via
 * phone_systems.admin_extension — never a literal extension '0'.
 */
function fakeDb(state: {
  adminExtension?: string | null;
  extensions?: Record<string, { profile_id: string }>;
  priorOwner?: string | null;
}) {
  const extensionFilters: Array<[string, unknown]> = [];
  const upserts: Array<{ table: string; row: Record<string, unknown> }> = [];
  const db = {
    from: (table: string) => {
      const filters: Array<[string, unknown]> = [];
      const query: any = {
        select: () => query,
        eq: (field: string, value: unknown) => {
          filters.push([field, value]);
          if (table === 'communication_extensions') extensionFilters.push([field, value]);
          return query;
        },
        order: () => query,
        limit: () => query,
        maybeSingle: async () => {
          if (table === 'phone_numbers') return { data: { phone_system_id: 'sys-1' }, error: null };
          if (table === 'communication_workspaces') return { data: { id: 'ws-1' }, error: null };
          if (table === 'phone_systems')
            return { data: { admin_extension: state.adminExtension ?? null }, error: null };
          if (table === 'communication_extensions') {
            const wanted = filters.find(([field]) => field === 'extension')?.[1];
            const row = typeof wanted === 'string' ? state.extensions?.[wanted] : undefined;
            return { data: row ?? null, error: null };
          }
          if (table === 'communication_sms_messages')
            return {
              data: state.priorOwner ? { owner_profile_id: state.priorOwner } : null,
              error: null,
            };
          return { data: null, error: null };
        },
        upsert: async (row: Record<string, unknown>) => {
          upserts.push({ table, row });
          return { error: null };
        },
      };
      return query;
    },
  };
  return { db, extensionFilters, upserts };
}

const inboundEvent = {
  data: {
    event_type: 'message.received',
    id: 'evt-1',
    payload: {
      id: 'msg-1',
      to: [{ phone_number: '+14632401404' }],
      from: { phone_number: '+13175550142' },
      text: 'Hello, is enrollment open?',
      media: [],
    },
  },
};

describe('storeSmsEvent owner resolution', () => {
  it('resolves the fallback owner through admin_extension 100, not literal 0', async () => {
    const { db, extensionFilters, upserts } = fakeDb({
      adminExtension: '100',
      extensions: {
        '100': { profile_id: 'admin-profile' },
        '0': { profile_id: 'stale-zero-profile' },
      },
    });
    const result = await storeSmsEvent(db, inboundEvent);
    expect(result).toEqual({ phoneSystemId: 'sys-1', ownerProfileId: 'admin-profile' });
    expect(extensionFilters).toContainEqual(['extension', '100']);
    expect(extensionFilters).not.toContainEqual(['extension', '0']);
    const stored = upserts.find((entry) => entry.table === 'communication_sms_messages');
    expect(stored?.row.owner_profile_id).toBe('admin-profile');
  });

  it('keeps a prior outbound conversation owner ahead of the admin fallback', async () => {
    const { db } = fakeDb({
      adminExtension: '100',
      extensions: { '100': { profile_id: 'admin-profile' } },
      priorOwner: 'holder-profile',
    });
    const result = await storeSmsEvent(db, inboundEvent);
    expect(result?.ownerProfileId).toBe('holder-profile');
  });

  it('leaves the owner unset when no admin extension is configured', async () => {
    const { db, extensionFilters, upserts } = fakeDb({ adminExtension: null, extensions: {} });
    const result = await storeSmsEvent(db, inboundEvent);
    expect(result?.ownerProfileId).toBeNull();
    expect(extensionFilters).not.toContainEqual(['extension', '0']);
    const stored = upserts.find((entry) => entry.table === 'communication_sms_messages');
    expect(stored?.row.owner_profile_id).toBeNull();
  });

  it('still stores the message when the admin extension row is missing', async () => {
    const { db, upserts } = fakeDb({ adminExtension: '100', extensions: {} });
    const result = await storeSmsEvent(db, inboundEvent);
    expect(result?.ownerProfileId).toBeNull();
    const stored = upserts.find((entry) => entry.table === 'communication_sms_messages');
    expect(stored?.row.body).toBe('Hello, is enrollment open?');
  });
});
