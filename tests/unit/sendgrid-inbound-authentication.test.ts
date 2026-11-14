// @vitest-environment node
import { generateKeyPairSync, sign } from 'node:crypto';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const m = vi.hoisted(() => ({
  claim: vi.fn(),
  finish: vi.fn(),
  store: vi.fn(),
  paris: vi.fn(),
  forward: vi.fn(),
}));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: async () => {} }));
vi.mock('@/lib/audit/withApiAudit', () => ({
  withApiAudit: (_: string, handler: unknown) => handler,
}));
vi.mock('@/lib/webhooks/event-tracker', () => ({
  claimWebhookEvent: m.claim,
  finalizeWebhookEvent: m.finish,
  claimInboundForward: vi.fn(),
}));
vi.mock('@/lib/email/communication-inbound', () => ({ storeInboundCommunicationEmail: m.store }));
vi.mock('@/lib/email/paris-mail', () => ({ respondToParisMail: m.paris }));
vi.mock('@/lib/email/sendgrid', () => ({ sendEmail: m.forward }));
import { POST as lmsPost } from '@/apps/lms/app/api/webhooks/sendgrid-inbound/route';
import { POST as marketingPost } from '@/apps/marketing/app/api/webhooks/sendgrid-inbound/route';
import { verifySendGridInboundRequest } from '@/lib/email/verify-sendgrid-inbound';
const keys = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const pem = keys.publicKey.export({ type: 'spki', format: 'pem' }).toString();
async function signedRequest(tamper = false) {
  const form = new FormData();
  form.set('from', 'applicant@example.org');
  form.set('to', 'admissions@elevateforhumanity.org');
  form.set('envelope', JSON.stringify({ to: ['admissions@elevateforhumanity.org'] }));
  form.set('subject', 'Enrollment');
  form.set('text', 'Please send information');
  const original = new Request('https://example.org/api/webhooks/sendgrid-inbound', {
    method: 'POST',
    body: form,
  });
  const bytes = Buffer.from(await original.arrayBuffer());
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = sign(
    'sha256',
    Buffer.concat([Buffer.from(timestamp), bytes]),
    keys.privateKey,
  ).toString('base64');
  const body = tamper ? Buffer.concat([bytes, Buffer.from('\r\nchanged')]) : bytes;
  return new NextRequest(original.url, {
    method: 'POST',
    body,
    headers: {
      'content-type': original.headers.get('content-type')!,
      'x-twilio-email-event-webhook-timestamp': timestamp,
      'x-twilio-email-event-webhook-signature': signature,
    },
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('SENDGRID_INBOUND_WEBHOOK_PUBLIC_KEY', pem);
  m.claim.mockResolvedValue({ shouldProcess: true, confident: true, leaseToken: 'test-lease' });
  m.store.mockResolvedValue({ stored: true, mailboxCount: 1 });
  m.finish.mockResolvedValue(undefined);
});
afterEach(() => vi.unstubAllEnvs());
for (const [name, post] of [
  ['LMS', lmsPost],
  ['Marketing', marketingPost],
] as const) {
  it(`${name} accepts signed multipart bytes and parses the same body afterwards`, async () => {
    expect((await post(await signedRequest())).status).toBe(200);
    expect(m.store).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Please send information' }),
    );
    expect(m.claim).toHaveBeenCalledWith(
      'sendgrid-inbound',
      expect.any(String),
      'email.received',
      expect.any(Object),
      { requireFinalizedDuplicate: true },
    );
    expect(m.finish).toHaveBeenCalledWith(
      'sendgrid-inbound',
      expect.any(String),
      'processed',
      undefined,
      { strict: true, leaseToken: 'test-lease' },
    );
  });
  it(`${name} rejects a modified signed body before database or forwarding work`, async () => {
    expect((await post(await signedRequest(true))).status).toBe(401);
    expect(m.claim).not.toHaveBeenCalled();
    expect(m.store).not.toHaveBeenCalled();
    expect(m.forward).not.toHaveBeenCalled();
  });
  it(`${name} fails closed when the signing key is missing`, async () => {
    vi.stubEnv('SENDGRID_INBOUND_WEBHOOK_PUBLIC_KEY', '');
    expect((await post(await signedRequest())).status).toBe(503);
    expect(m.claim).not.toHaveBeenCalled();
  });
  it(`${name} retains provider retry when durable finalization fails`, async () => {
    m.finish.mockRejectedValue(new Error('Unavailable'));
    expect((await post(await signedRequest())).status).toBe(500);
  });
  it(`${name} does not acknowledge a duplicate with an unconfirmed completion state`, async () => {
    m.claim.mockResolvedValue({ shouldProcess: true, isDuplicate: true, confident: false });
    expect((await post(await signedRequest())).status).toBe(503);
    expect(m.store).not.toHaveBeenCalled();
  });
}
it('accepts DER keys and rejects unsigned requests or invalid configuration', async () => {
  const der = keys.publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
  expect(await verifySendGridInboundRequest(await signedRequest(), der)).toEqual({
    verified: true,
  });
  expect(await verifySendGridInboundRequest(new Request('https://example.org'), pem)).toEqual({
    verified: false,
    status: 401,
  });
  expect(await verifySendGridInboundRequest(await signedRequest(), 'invalid-key')).toEqual({
    verified: false,
    status: 503,
  });
});
