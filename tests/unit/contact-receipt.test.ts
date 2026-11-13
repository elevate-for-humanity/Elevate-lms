import { beforeEach, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ insert: vi.fn(), send: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ from: () => ({ insert: state.insert }) }) }));
vi.mock('@/lib/email/sendgrid', () => ({ sendEmail: state.send }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/audit/withApiAudit', () => ({ withApiAudit: (_path: string, handler: unknown) => handler }));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: async () => {} }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));
import { POST } from '@/apps/marketing/app/api/contact/route';

const body = { name: 'Client Example', email: 'client@example.test', phone: '3175550100', message: 'Interested in downtown nail services.', role: 'beauty-service-client', interest: 'mesmerized-downtown-client' };
const submit = (data = body) => POST(new Request('https://www.example.test/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }));
beforeEach(() => { state.insert.mockReset().mockResolvedValue({ error: null }); state.send.mockReset().mockResolvedValue({ success: true }); });

it('keeps the client request, phone and source in CRM without marketing subscription or enrollment', async () => {
  const result = await submit();
  expect(await result.json()).toEqual({ ok: true, dbSaved: true, emailAccepted: true });
  expect(state.insert).toHaveBeenCalledWith(expect.objectContaining({ name: body.name, phone: body.phone, message: body.message, contact_type: body.role, program_interest: body.interest, subscribed: false, tags: expect.arrayContaining([body.interest]) }));
  expect(state.send).toHaveBeenCalledWith(expect.objectContaining({ replyTo: body.email, subject: expect.stringContaining('Downtown client inquiry') }));
});
it('returns an error when neither the database nor the email provider accepts the inquiry', async () => {
  state.insert.mockResolvedValue({ error: { message: 'Unavailable' } });
  state.send.mockResolvedValue({ success: false, error: 'Provider unavailable' });
  const result = await submit();
  expect(result.status).toBe(503);
  expect((await result.json()).ok).toBe(false);
});
it('accepts a persisted inquiry when the notification fails, without claiming email acceptance', async () => {
  state.send.mockResolvedValue({ success: false });
  expect(await (await submit()).json()).toEqual({ ok: true, dbSaved: true, emailAccepted: false });
});
it('can accept email as a fallback when the database is unavailable', async () => {
  state.insert.mockRejectedValue(new Error('Unavailable'));
  expect(await (await submit()).json()).toEqual({ ok: true, dbSaved: false, emailAccepted: true });
});
it('waits for email acceptance before returning the receipt', async () => {
  let release!: (value: { success: boolean }) => void;
  state.send.mockImplementation(() => new Promise(resolve => { release = resolve; }));
  let finished = false;
  const request = submit().then(result => { finished = true; return result; });
  await vi.waitFor(() => expect(state.send).toHaveBeenCalled());
  expect(finished).toBe(false);
  release({ success: true });
  expect((await request).status).toBe(200);
});
it('escapes visitor text in the staff email and rejects malformed data before writing', async () => {
  await submit({ ...body, name: '<b>Client</b>', message: '<script>alert(1)</script>' });
  expect(state.send.mock.calls[0][0].html).not.toContain('<script>');
  expect(state.send.mock.calls[0][0].html).toContain('&lt;script&gt;');
  state.insert.mockClear();
  expect((await submit({ ...body, email: 'invalid' })).status).toBe(400);
  expect(state.insert).not.toHaveBeenCalled();
});
it('keeps native contact forms on the failure path when all delivery options fail', async () => {
  state.insert.mockResolvedValue({ error: { message: 'Unavailable' } });
  state.send.mockRejectedValue(new Error('Unavailable'));
  const result = await POST(new Request('https://www.example.test/api/contact', { method: 'POST', body: new URLSearchParams(body) }));
  expect(result.status).toBe(303);
  expect(result.headers.get('location')).toBe('https://www.example.test/contact?error=error');
});
it('preserves the same selected service in native and JSON inquiries', async () => {
  const selected = { ...body, service: 'Esthetic services', message: 'Please contact me about availability.' };
  await submit(selected);
  const jsonRecord = state.insert.mock.calls[0][0];
  state.insert.mockClear();
  state.send.mockClear();
  const native = await POST(new Request('https://www.example.test/api/contact', { method: 'POST', body: new URLSearchParams(selected) }));
  expect(native.status).toBe(303);
  expect(native.headers.get('location')).toContain('submitted=1');
  expect(state.insert.mock.calls[0][0]).toEqual(jsonRecord);
  expect(jsonRecord.message).toContain('Service interest: Esthetic services.');
  expect(state.send.mock.calls[0][0].html).toContain('Service interest: Esthetic services.');
});
it('rejects a service outside the supported choices before storage or notification', async () => {
  const response = await submit({ ...body, service: 'unsupported service' } as typeof body);
  expect(response.status).toBe(400);
  expect(state.insert).not.toHaveBeenCalled();
  expect(state.send).not.toHaveBeenCalled();
});
