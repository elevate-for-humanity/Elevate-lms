import { describe, expect, it } from 'vitest';
import { ensureActorMailboxes } from '@/lib/email/communication-mailbox';

describe('archived Program Holder interoffice visibility', () => {
  it('retains Host Shop mailbox and hides archived Program Holder account', async () => {
    const mailboxes = [
      { access_level: 'manager', mailbox: {
        id: 'holder-mailbox', address: 'holder@example.org',
        display_name: 'Old Program Office', mailbox_kind: 'program_holder', active: true,
      } },
      { access_level: 'manager', mailbox: {
        id: 'shop-mailbox', address: 'shop@example.org',
        display_name: 'Approved Host Shop', mailbox_kind: 'host_shop', active: true,
      } },
    ];
    const db = {
      from(table: string) {
        const query: any = {
          select: () => query,
          eq: () => query,
          limit: () => query,
          maybeSingle: async () => ({
            data: table === 'profiles' ? { role: 'host_shop', full_name: 'Test Partner' } :
              { features: { portal_access_archived: true } },
            error: null,
          }),
          then: (resolve: (value: unknown) => void) =>
            Promise.resolve({ data: table === 'communication_email_mailbox_members' ? mailboxes : [], error: null }).then(resolve),
        };
        return query;
      },
    };
    const result = await ensureActorMailboxes(db as any, 'test-user');
    expect(result.map(m => m.mailboxKind)).toEqual(['host_shop']);
    expect(result[0].address).toBe('shop@example.org');
  });
});
