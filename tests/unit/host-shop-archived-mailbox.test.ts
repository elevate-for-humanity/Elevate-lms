import { describe, expect, it } from 'vitest';
import { ensureActorMailboxes } from '@/lib/email/communication-mailbox';

const mailboxMembers = [
  { access_level: 'manager', mailbox: {
    id: 'holder-mailbox', address: 'holder@example.org',
    display_name: 'Historical Program Office', mailbox_kind: 'program_holder', active: true,
  } },
  { access_level: 'manager', mailbox: {
    id: 'shop-mailbox', address: 'shop@example.org',
    display_name: 'Approved Host Shop', mailbox_kind: 'host_shop', active: true,
  } },
];

function mailboxReadOnlyDb(
  profileRole: string | null,
  holderRecords: Array<{ features: { portal_access_archived: boolean } }>,
  holderLookupError: Error | null = null,
  profileLookupError: Error | null = null,
) {
  const queried: string[] = [];
  const db = {
    from(table: string) {
      queried.push(table);
      const query: any = {
        select: () => query,
        eq: () => query,
        maybeSingle: async () => {
          if (table !== 'profiles') {
            throw new Error('Archived-holder lookup must not select an arbitrary first row');
          }
          return {
            data: profileRole ? { role: profileRole, full_name: 'Test Partner' } : null,
            error: profileLookupError,
          };
        },
        then: (resolve: (value: unknown) => void) =>
          Promise.resolve(
            table === 'program_holders'
              ? { data: holderRecords, error: holderLookupError }
              : { data: table === 'communication_email_mailbox_members' ? mailboxMembers : [], error: null },
          ).then(resolve),
      };
      return query;
    },
  };
  return { db, queried };
}

describe('archived Program Holder interoffice visibility', () => {
  it('keeps only Host Shop mail when an archived holder record is not the first', async () => {
    const { db, queried } = mailboxReadOnlyDb('host_shop', [
      { features: { portal_access_archived: false } },
      { features: { portal_access_archived: true } },
    ]);
    const mailboxes = await ensureActorMailboxes(db as any, 'test-user');
    expect(mailboxes.map(m => m.mailboxKind)).toEqual(['host_shop']);
    expect(mailboxes[0].address).toBe('shop@example.org');
    expect(queried).toEqual([
      'communication_email_mailbox_members', 'profiles', 'program_holders',
    ]);
  });

  it('preserves existing role-specific mailboxes if no holder record is archived', async () => {
    const { db } = mailboxReadOnlyDb('host_shop', [
      { features: { portal_access_archived: false } },
    ]);
    const mailboxes = await ensureActorMailboxes(db as any, 'test-user');
    expect(mailboxes.map(m => m.mailboxKind)).toEqual(['program_holder', 'host_shop']);
  });

  it('does not change other Program Holder identities', async () => {
    const { db } = mailboxReadOnlyDb('program_holder', [
      { features: { portal_access_archived: true } },
    ]);
    const mailboxes = await ensureActorMailboxes(db as any, 'test-user');
    expect(mailboxes.map(m => m.mailboxKind)).toEqual(['program_holder', 'host_shop']);
  });


  it('fails closed if profile lookup errors instead of falling back to historical mailboxes', async () => {
    const { db } = mailboxReadOnlyDb('host_shop', [
      { features: { portal_access_archived: true } },
    ], null, new Error('canonical actor profile unavailable'));
    await expect(ensureActorMailboxes(db as any, 'test-user'))
      .rejects.toThrow('canonical actor profile unavailable');
  });

  it('fails closed if the actor profile is absent despite existing mailbox memberships', async () => {
    const { db } = mailboxReadOnlyDb(null, [
      { features: { portal_access_archived: true } },
    ]);
    await expect(ensureActorMailboxes(db as any, 'test-user'))
      .rejects.toThrow('MAILBOX_PROFILE_UNAVAILABLE');
  });

  it('fails closed when archived-holder lookup fails', async () => {
    const { db } = mailboxReadOnlyDb('host_shop', [], new Error('holder lookup unavailable'));
    await expect(ensureActorMailboxes(db as any, 'test-user'))
      .rejects.toThrow('holder lookup unavailable');
  });
});
