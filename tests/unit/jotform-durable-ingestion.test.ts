// @vitest-environment node
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ db: null as unknown, secret: vi.fn() }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/secrets', () => ({ getSecret: mocks.secret }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => mocks.db }));
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
import { POST } from '@/apps/marketing/app/api/webhooks/jotform/route';
function fixture(insertError: { code: string } | null = null, receiptError = false, existingForm = '123') {
  const insert = vi.fn().mockResolvedValue({ error: insertError });
  const upsert = vi.fn().mockResolvedValue({ error: receiptError ? { code: 'XX000' } : null });
  mocks.db = { from: (table: string) => table === 'jotform_submissions' ? {
    insert, select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { form_id: existingForm }, error: null }) }) }),
  } : { upsert } };
  return { insert, upsert };
}
function request(rawRequest = '{"answer":"private-content"}', secret = 'private-secret') {
  return new NextRequest('https://www.elevateforhumanity.org/api/webhooks/jotform?secret=' + secret, {
    method: 'POST', body: new URLSearchParams({ formID: '123', submissionID: '456', rawRequest }),
  });
}
beforeEach(() => { vi.clearAllMocks(); mocks.secret.mockResolvedValue('private-secret'); });
afterEach(() => vi.unstubAllGlobals());

it('acknowledges only after saving submission and durable provider receipt', async () => {
  const f = fixture(); const result = await POST(request());
  expect(result.status).toBe(200);
  expect(f.upsert).toHaveBeenCalledWith(expect.objectContaining({ provider: 'jotform', event_id: '456', status: 'processed' }), { onConflict: 'provider,event_id' });
});
it('returns a retryable failure on storage errors and never acknowledges data loss', async () => {
  const f = fixture({ code: '42P01' }); const result = await POST(request());
  expect(result.status).toBe(503); expect(result.headers.get('Retry-After')).toBe('30');
  expect(f.upsert).not.toHaveBeenCalled();
});
it('replays a confirmed duplicate without overwriting original answers or processing state', async () => {
  const f = fixture({ code: '23505' }); expect((await POST(request())).status).toBe(200);
  expect(f.insert).toHaveBeenCalledTimes(1); expect(f.upsert).toHaveBeenCalledTimes(1);
  fixture({ code: '23505' }, false, 'another-form'); expect((await POST(request())).status).toBe(503);
});
it('does not hide delivery-receipt persistence failure', async () => {
  fixture(null, true); expect((await POST(request())).status).toBe(503);
});
it.each(['not-json', '[]', 'null'])('rejects malformed answers (%s) before persistence', async raw => {
  const f = fixture(); expect((await POST(request(raw))).status).toBe(400);
  expect(f.insert).not.toHaveBeenCalled();
});
it('uses the canonical secret and rejects unauthenticated requests', async () => {
  const f = fixture(); expect((await POST(request('{}', 'wrong'))).status).toBe(401);
  expect(mocks.secret).toHaveBeenCalledWith('JOTFORM_WEBHOOK_SECRET'); expect(f.insert).not.toHaveBeenCalled();
});
