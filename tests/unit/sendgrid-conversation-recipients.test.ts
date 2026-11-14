// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: async () => {} }));
vi.mock('@/lib/supabase/admin', () => ({ getAdminClient: async () => null }));
vi.mock('@/lib/resilience', () => ({ withResilience: (fn: () => unknown) => fn(), breakers: { sendgrid: {} } }));
import { sendEmail } from '@/lib/email/sendgrid';
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it('sends one conversation with distinct To, CC, and BCC lists and recipient-specific tracking', async () => {
  vi.stubEnv('SENDGRID_API_KEY', 'test-only');
  const fetch = vi.fn(async (_url: string, _init?: RequestInit) => ({ ok: true, headers: new Headers({ 'x-message-id': 'provider-id' }) }));
  vi.stubGlobal('fetch', fetch);
  await sendEmail({ to: ['one@example.org', 'two@example.org'], cc: ['copy@example.org'], bcc: ['blind@example.org'], groupRecipients: true, subject: 'Conversation', html: '<p>Hello</p>' });
  const body = JSON.parse(String(fetch.mock.calls[0][1]?.body));
  expect(body.personalizations).toHaveLength(1);
  expect(body.personalizations[0]).toMatchObject({ to: [{ email: 'one@example.org' }, { email: 'two@example.org' }], cc: [{ email: 'copy@example.org' }], bcc: [{ email: 'blind@example.org' }] });
  const ids = JSON.parse(body.personalizations[0].custom_args.elevate_email_log_ids);
  expect(Object.keys(ids)).toEqual(['one@example.org', 'two@example.org']);
  expect(ids['one@example.org']).not.toBe(ids['two@example.org']);
  expect(body.personalizations[0].custom_args.elevate_email_log_id).toBeUndefined();
});
it('preserves individual delivery for automated senders', async () => {
  vi.stubEnv('SENDGRID_API_KEY', 'test-only');
  const fetch = vi.fn(async (_url: string, _init?: RequestInit) => ({ ok: true, headers: new Headers() }));
  vi.stubGlobal('fetch', fetch);
  await sendEmail({ to: ['one@example.org', 'two@example.org'], subject: 'Notice', html: '<p>Hello</p>' });
  const body = JSON.parse(String(fetch.mock.calls[0][1]?.body));
  expect(body.personalizations).toHaveLength(2);
  expect(body.personalizations[0].to).toEqual([{ email: 'one@example.org' }]);
  expect(body.personalizations[1].to).toEqual([{ email: 'two@example.org' }]);
});
