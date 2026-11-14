import { describe, expect, it, vi } from 'vitest';
import {
  applicantConversationSubject,
  programConversationRoute,
} from '@/lib/email/program-conversation-routing';

function database(
  applications: any[] = [{ program_slug: 'cdl-training', program_id: 'cdl' }],
  holders = ['academy'],
  archived = false,
  hostMailboxes = ['mesmerized.by.beauty.cosmetology.academy-2@elevateforhumanity.org'],
  partnerPrograms = ['esthetician-apprenticeship', 'nail-technician-apprenticeship'],
  activeMember = true,
) {
  const from = vi.fn((table: string) => {
    const query: any = {
      select: () => query,
      eq: () => query,
      ilike: vi.fn(() => query),
      in: () => query,
      neq: () => query,
      maybeSingle: async () => ({
        data: table === 'program_holders'
          ? { user_id: 'holder-owner', features: { portal_access_archived: archived } }
          : table === 'profiles' ? { role: 'host_shop' } : null,
        error: null,
      }),
      then: (resolve: any) =>
        Promise.resolve({
          data:
            table === 'applications'
              ? applications
              : table === 'program_holder_students'
                ? holders.map((id) => ({
                    program_holder_id: id, program_id: applications[0]?.program_id || 'cdl',
                  }))
                : table === 'program_holder_programs'
                  ? holders.map((id) => ({
                    program_holder_id: id,
                    program_id: applications[0]?.program_id || 'cdl',
                    program_slug: applications[0]?.program_slug || 'cdl-training',
                  }))
                  : table === 'partner_users'
                    ? activeMember ? [{ partner_id: 'mesmerized-partner', role: 'owner' }] : []
                    : table === 'partners'
                      ? [{ id: 'mesmerized-partner', status: 'active', approval_status: 'approved',
                        is_active: true, programs: partnerPrograms }]
                      : table === 'shops'
                        ? [{ id: 'mesmerized-shop', partner_id: 'mesmerized-partner', active: true }]
                  : table === 'communication_email_mailbox_members'
                    ? hostMailboxes.map((address) => ({ access_level: 'manager', mailbox: { address, mailbox_kind: 'host_shop', active: true } }))
                    : [{ address: 'the.cdl.academy@elevateforhumanity.org' }],
          error: null,
        }).then(resolve),
    };
    return query;
  });
  return { from } as any;
}
describe('assigned program interoffice conversations', () => {
  it('escapes SQL wildcard metacharacters in both applicant identity filters', async () => {
    const db = database();
    await programConversationRoute(
      db,
      ['STUDENT_10%OFF@example.com'],
      ['admissions@elevateforhumanity.org'],
    );
    const filters = db.from.mock.calls.map((args: string[], index: number) => ({
      table: args[0],
      ilike: db.from.mock.results[index].value.ilike.mock.calls,
    }));
    expect(filters.find((item: any) => item.table === 'applications')?.ilike).toContainEqual([
      'email', String.raw`student\_10\%off@example.com`,
    ]);
    expect(filters.find((item: any) => item.table === 'program_holder_students')?.ilike).toContainEqual([
      'applicant_email', String.raw`student\_10\%off@example.com`,
    ]);
  });
  it('routes non-CDL programs through their canonical holder assignment', async () => {
    expect(await programConversationRoute(database([{program_slug:'barber-apprenticeship',program_id:'cdl'}]),['student@example.com'],['admissions@elevateforhumanity.org'])).not.toBeNull();
  });
  it('copies student replies to admin and the assigned holder', async () => {
    expect(
      await programConversationRoute(
        database(),
        ['student@example.com'],
        ['admissions@elevateforhumanity.org'],
      ),
    ).toEqual({
      applicantEmail: 'student@example.com',
      replyTo: 'admissions@elevateforhumanity.org',
      addresses: ['admissions@elevateforhumanity.org', 'the.cdl.academy@elevateforhumanity.org'],
    });
  });
  it('copies holder responses back to the same admin inbox', async () => {
    expect(
      await programConversationRoute(
        database(),
        ['student@example.com'],
        ['the.cdl.academy@elevateforhumanity.org'],
      ),
    ).not.toBeNull();
  });
  it('does not expose a bulk roster or another holders conversation', async () => {
    expect(
      await programConversationRoute(
        database(),
        ['a@example.com', 'b@example.com'],
        ['admissions@elevateforhumanity.org'],
      ),
    ).toBeNull();
    expect(
      await programConversationRoute(
        database(),
        ['a@example.com'],
        ['unrelated@elevateforhumanity.org'],
      ),
    ).toBeNull();
    expect(
      await programConversationRoute(
        database([], ['academy']),
        ['a@example.com'],
        ['admissions@elevateforhumanity.org'],
      ),
    ).toBeNull();
    expect(
      await programConversationRoute(
        database(undefined, ['academy', 'other']),
        ['a@example.com'],
        ['admissions@elevateforhumanity.org'],
      ),
    ).toBeNull();
  });
  it('leaves Class B and Texas with their separate partners', async () => {
    for (const pathway_slug of ['class-b', 'texas']) {
      expect(
        await programConversationRoute(
          database([{ program_slug: 'cdl-training', pathway_slug }]),
          ['a@example.com'],
          ['admissions@elevateforhumanity.org'],
        ),
      ).toBeNull();
    }
  });
  it('routes archived Program Holder applicant mail exclusively to the owned Host Shop inbox', async () => {
    expect(await programConversationRoute(
      database([{ program_slug: 'esthetician-apprenticeship', program_id: 'esthetician' }], ['academy'], true),
      ['student@example.com'],
      ['admissions@elevateforhumanity.org'],
    )).toMatchObject({
      addresses: ['admissions@elevateforhumanity.org', 'mesmerized.by.beauty.cosmetology.academy-2@elevateforhumanity.org'],
    });
  });
  it('fails closed rather than sharing applicant mail across multiple Host Shops', async () => {
    expect(await programConversationRoute(
      database([{ program_slug: 'nail-technician-apprenticeship', program_id: 'nails' }], ['academy'], true, ['shop-one@example.org', 'shop-two@example.org']),
      ['student@example.com'],
      ['admissions@elevateforhumanity.org'],
    )).toBeNull();
  });
  it('denies archived holder barber, cosmetology, and CDL copies at a beauty-only shop', async () => {
    for (const slug of ['barber-apprenticeship', 'cosmetology-apprenticeship', 'cdl-training']) {
      expect(await programConversationRoute(
        database([{ program_slug: slug, program_id: 'legacy' }], ['academy'], true),
        ['student@example.com'], ['admissions@elevateforhumanity.org'],
      )).toBeNull();
    }
  });
  it('denies historic copies when approved Host Shop membership is absent', async () => {
    expect(await programConversationRoute(
      database([{ program_slug: 'esthetician-apprenticeship', program_id: 'esthetician' }],
        ['academy'], true, undefined, undefined, false),
      ['student@example.com'], ['admissions@elevateforhumanity.org'],
    )).toBeNull();
  });
  it('fails closed for multiple partners rather than combining their program permissions', async () => {
    const db = database([{ program_slug: 'esthetician-apprenticeship', program_id: 'esthetician' }],
      ['academy'], true);
    const from = db.from;
    db.from = (table: string) => {
      const q = from(table);
      if (table === 'partner_users') q.then = (resolve: any) => Promise.resolve({ data: [
        { partner_id: 'mesmerized-partner', role: 'owner' },
        { partner_id: 'other-partner', role: 'owner' },
      ], error: null }).then(resolve);
      if (table === 'partners') q.then = (resolve: any) => Promise.resolve({ data: [
        { id: 'mesmerized-partner', programs: ['esthetician-apprenticeship'],
          status: 'active', approval_status: 'approved', is_active: true },
        { id: 'other-partner', programs: ['barber-apprenticeship'],
          status: 'active', approval_status: 'approved', is_active: true },
      ], error: null }).then(resolve);
      if (table === 'shops') q.then = (resolve: any) => Promise.resolve({ data: [
        { id: 'mesmerized-shop', partner_id: 'mesmerized-partner', active: true },
        { id: 'other-shop', partner_id: 'other-partner', active: true },
      ], error: null }).then(resolve);
      return q;
    };
    expect(await programConversationRoute(
      db, ['student@example.com'], ['admissions@elevateforhumanity.org'],
    )).toBeNull();
  });
  it('keeps different applicants separate even with identical outreach subjects', () => {
    expect(applicantConversationSubject('Re: WorkOne status', 'a@example.com')).toBe(
      applicantConversationSubject('WorkOne status', 'a@example.com'),
    );
    expect(applicantConversationSubject('WorkOne status', 'a@example.com')).not.toBe(
      applicantConversationSubject('WorkOne status', 'b@example.com'),
    );
  });
});
