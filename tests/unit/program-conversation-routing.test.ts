import { describe, expect, it, vi } from 'vitest';
import {
  applicantConversationSubject,
  programConversationRoute,
} from '@/lib/email/program-conversation-routing';

function database(
  applications: any[] = [{ program_slug: 'cdl-training', program_id: 'cdl' }],
  holders = ['academy'],
) {
  const from = vi.fn((table: string) => {
    const query: any = {
      select: () => query,
      eq: () => query,
      ilike: () => query,
      in: () => query,
      then: (resolve: any) =>
        Promise.resolve({
          data:
            table === 'applications'
              ? applications
              : table === 'program_holder_students'
                ? holders.map((id) => ({ program_holder_id: id, program_id: 'cdl' }))
                : table === 'program_holder_programs'
                  ? holders.map((id) => ({ program_holder_id: id, program_id: 'cdl' }))
                  : [{ address: 'the.cdl.academy@elevateforhumanity.org' }],
          error: null,
        }).then(resolve),
    };
    return query;
  });
  return { from } as any;
}
describe('assigned program interoffice conversations', () => {
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
  it('keeps different applicants separate even with identical outreach subjects', () => {
    expect(applicantConversationSubject('Re: WorkOne status', 'a@example.com')).toBe(
      applicantConversationSubject('WorkOne status', 'a@example.com'),
    );
    expect(applicantConversationSubject('WorkOne status', 'a@example.com')).not.toBe(
      applicantConversationSubject('WorkOne status', 'b@example.com'),
    );
  });
});
