// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const m = vi.hoisted(() => ({ admin: vi.fn(), limit: vi.fn(), insert: vi.fn(), single: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: m.admin }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: m.limit }));
import { POST } from '@/apps/marketing/app/api/tax/contact/route';
const payload = {
  name: 'Example Customer',
  email: 'customer@example.invalid',
  phone: '',
  service: 'review',
  taxYear: 2025,
  message: 'Please contact me about reviewing a return.',
};
function req(extra = {}) {
  return new NextRequest('https://example.com/api/tax/contact', {
    method: 'POST',
    body: JSON.stringify({ ...payload, ...extra }),
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  m.limit.mockResolvedValue(null);
  m.single.mockResolvedValue({ data: { id: 'request-reference' }, error: null });
  m.insert.mockReturnValue({ select: () => ({ single: m.single }) });
  m.admin.mockResolvedValue({ from: () => ({ insert: m.insert }) });
});
describe('Supersonic professional inquiry delivery', () => {
  it('saves the message and contact details in the tax queue before confirming receipt', async () => {
    const r = await POST(req());
    expect(r.status).toBe(201);
    expect(await r.json()).toMatchObject({ ok: true, reference: 'request-reference' });
    expect(m.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        tax_year: 2025,
        status: 'submitted',
        payload: expect.objectContaining({
          message: payload.message,
          kind: 'professional_inquiry',
          officeCode: 'SFC-IND-001',
        }),
      }),
    );
    expect(r.headers.get('Cache-Control')).toBe('private, no-store');
  });
  it('never claims success when persistence fails', async () => {
    m.single.mockResolvedValue({ data: null, error: { code: '42501' } });
    const r = await POST(req());
    expect(r.status).toBe(503);
    expect(await r.json()).not.toHaveProperty('ok', true);
  });
  it('rejects unsupported services before privileged access', async () => {
    expect((await POST(req({ service: 'bank-loan-approval' }))).status).toBe(400);
    expect(m.admin).not.toHaveBeenCalled();
  });
  it('rejects an SSN in the public inquiry instead of storing it', async () => {
    expect((await POST(req({ message: 'My SSN is 123-45-6789' }))).status).toBe(400);
    expect(m.insert).not.toHaveBeenCalled();
  });
  it('honors rate limiting before accessing storage', async () => {
    m.limit.mockResolvedValue(new Response('Too many requests', { status: 429 }));
    expect((await POST(req())).status).toBe(429);
    expect(m.admin).not.toHaveBeenCalled();
  });
});
