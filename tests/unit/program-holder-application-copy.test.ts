import type { SupabaseClient } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mail = vi.hoisted(() => vi.fn());
vi.mock('@/lib/email/sendgrid', () => ({ sendEmail: mail }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
import { copyApplicationToProgramHolders } from '@/lib/program-holder/application-copy';

function database(options: { enabled?: boolean; sent?: boolean; program?: boolean } = {}) {
  const inserted: unknown[] = [];
  const filters: unknown[] = [];
  const from = (table: string) => {
    const query = {
      select: () => query,
      eq: (key: string, value: unknown) => {
        filters.push([table, key, value]);
        return query;
      },
      in: () => query,
      limit: () => query,
      maybeSingle: async () => ({
        data:
          table === 'programs'
            ? options.program === false
              ? null
              : { id: 'program-1', title: 'Nails' }
            : null,
        error: null,
      }),
      insert: async (value: unknown) => {
        inserted.push(value);
        return { error: null };
      },
      then: (resolve: (result: { data: unknown; error: null }) => unknown) =>
        Promise.resolve(
          resolve({
            data:
              table === 'program_holder_programs'
                ? [{ program_holder_id: 'holder-1' }]
                : table === 'program_holders'
                  ? [
                      {
                        id: 'holder-1',
                        status: 'active',
                        contact_email: 'verified@example.org',
                        features: { application_copies: options.enabled !== false },
                      },
                    ]
                  : options.sent
                    ? [{ id: 'sent-1' }]
                    : [],
            error: null,
          }),
        ),
    };
    return query;
  };
  return { db: { from } as unknown as SupabaseClient, inserted, filters };
}
const application = {
  id: 'application-1',
  programSlug: 'nail-technician-apprenticeship',
  name: 'A <B>',
  email: 'learner@example.org',
  phone: '3175550100',
};
beforeEach(() => mail.mockReset().mockResolvedValue({ success: true }));
describe('assigned program application copies', () => {
  it('saves an application copy and emails only the opted-in assigned holder', async () => {
    const mock = database();
    await copyApplicationToProgramHolders(mock.db, application);
    expect(mock.filters).toContainEqual(['program_holder_programs', 'program_id', 'program-1']);
    expect(mock.inserted).toEqual([
      expect.objectContaining({
        program_holder_id: 'holder-1',
        program_id: 'program-1',
        application_id: 'application-1',
        applicant_phone: '3175550100',
      }),
    ]);
    expect(mail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'verified@example.org',
        replyTo: 'learner@example.org',
        html: expect.stringContaining('A &lt;B&gt;'),
      }),
    );
  });
  it('does not disclose applications when copying is not explicitly enabled', async () => {
    const mock = database({ enabled: false });
    await copyApplicationToProgramHolders(mock.db, application);
    expect(mock.inserted).toHaveLength(0);
    expect(mail).not.toHaveBeenCalled();
  });
  it('does not email another copy after a successful delivery is recorded', async () => {
    const mock = database({ sent: true });
    await copyApplicationToProgramHolders(mock.db, application);
    expect(mail).not.toHaveBeenCalled();
  });
  it('does not widen scope when the program cannot be resolved', async () => {
    const mock = database({ program: false });
    await copyApplicationToProgramHolders(mock.db, application);
    expect(mock.inserted).toHaveLength(0);
    expect(mail).not.toHaveBeenCalled();
  });
});
