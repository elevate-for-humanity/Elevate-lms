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
) {
  const from = vi.fn((table: string) => {
    const query: any = {
      select: () => query,
      eq: () => query,
      ilike: vi.fn(() => query),
      in: () => query,
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
                ? holders.map((id) => ({ program_holder_id: id, program_id: 'cdl' }))
                : table === 'program_holder_programs'
                  ? holders.map((id) => ({ program_holder_id: id, program_id: 'cdl' }))
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
      database(undefined, ['academy'], true),
      ['student@example.com'],
      ['admissions@elevateforhumanity.org'],
    )).toMatchObject({
      addresses: ['admissions@elevateforhumanity.org', 'mesmerized.by.beauty.cosmetology.academy-2@elevateforhumanity.org'],
    });
  });
  it('fails closed rather than sharing applicant mail across multiple Host Shops', async () => {
    expect(await programConversationRoute(
      database(undefined, ['academy'], true, ['shop-one@example.org', 'shop-two@example.org']),
      ['student@example.com'],
      ['admissions@elevateforhumanity.org'],
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
