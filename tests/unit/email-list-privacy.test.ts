import { expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({
  calls: [] as Array<{ table: string; method: string; args: unknown[] }>,
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }) },
  }),
}));
vi.mock('@/lib/admin/portal-preview', () => ({
  resolvePortalPreviewSubject: async () => ({ previewing: false }),
}));
vi.mock('@/lib/email/communication-mailbox', () => ({
  ensureActorMailboxes: async () => [{ id: 'authorized-box', address: 'office@example.org' }],
  actorPrimaryMailbox: (boxes: unknown[]) => boxes[0],
}));
vi.mock('@/lib/email/sendgrid', () => ({ sendEmail: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    from: (table: string) => {
      const data =
        table === 'profiles'
          ? { email: 'owner@example.org' }
          : table === 'communication_email_threads'
            ? [
                {
                  id: 'thread',
                  last_message_at: '2026-11-14',
                  latest_mail: [
                    {
                      sender_name: 'Applicant',
                      sender_email: 'applicant@example.org',
                      text_body: 'Visible preview '.repeat(30) + 'PRIVATE_BODY_TAIL',
                    },
                  ],
                  scope_mail: [{ id: 'internal-join' }],
                  search_mail: [{ id: 'internal-search' }],
                },
              ]
            : [];
      const query: any = {
        then: (resolve: any) => Promise.resolve({ data, error: null }).then(resolve),
      };
      for (const method of ['select', 'eq', 'in', 'order', 'limit', 'maybeSingle', 'overrideTypes'])
        query[method] = (...args: unknown[]) => {
          state.calls.push({ table, method, args });
          return query;
        };
      return query;
    },
  }),
}));
import { handleCommunicationEmailGet } from '@/lib/email/communication-email-api';
it('returns a bounded text preview and scopes the latest-message embed to the authorized mailbox', async () => {
  const response = await handleCommunicationEmailGet(
    new Request('https://app.example.org/api/communications/email'),
  );
  expect(response.status).toBe(200);
  const payload = await response.json();
  expect(payload.threads[0].sender).toBe('Applicant');
  expect(payload.threads[0].preview).toHaveLength(160);
  expect(JSON.stringify(payload)).not.toContain('PRIVATE_BODY_TAIL');
  expect(payload.threads[0]).not.toHaveProperty('latest_mail');
  expect(payload.threads[0]).not.toHaveProperty('scope_mail');
  expect(payload.threads[0]).not.toHaveProperty('search_mail');
  expect(state.calls).toContainEqual({
    table: 'communication_email_threads',
    method: 'eq',
    args: ['latest_mail.mailbox_id', 'authorized-box'],
  });
  expect(state.calls).toContainEqual({
    table: 'communication_email_threads',
    method: 'limit',
    args: [1, { referencedTable: 'latest_mail' }],
  });
});
