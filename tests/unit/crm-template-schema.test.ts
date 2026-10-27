// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest';
const { auth, client, select } = vi.hoisted(() => ({ auth: vi.fn(), client: vi.fn(), select: vi.fn() }));
vi.mock('@/lib/admin/guards', () => ({ apiRequireAdmin: auth }));
vi.mock('@/lib/supabase/server', () => ({ createClient: client }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: vi.fn() }));
vi.mock('@/lib/audit/withApiAudit', () => ({ withApiAudit: (_path: string, fn: any) => fn }));
import { GET } from '../../apps/admin/app/api/crm/templates/route';
beforeEach(() => {
  vi.clearAllMocks(); auth.mockResolvedValue({ id: 'admin' });
  client.mockResolvedValue({ from: () => ({ select }) });
});
const query = (result: unknown) => ({ eq: vi.fn(() => ({ order: vi.fn().mockResolvedValue(result) })) });
describe('CRM template schema compatibility', () => {
  it('loads active templates from the baseline schema and preserves content', async () => {
    select.mockReturnValueOnce(query({ data: null, error: { code: '42703' } }))
      .mockReturnValueOnce(query({ data: [{ id: 'template', name: 'Welcome', content: '<p>Hello</p>', status: 'active' }], error: null }));
    const r = await GET(new Request('https://admin.elevateforhumanity.org/api/crm/templates'));
    expect(r.status).toBe(200);
    expect((await r.json()).templates[0]).toMatchObject({ html_content: '<p>Hello</p>', category: 'general', subject: 'Welcome' });
    expect(select).toHaveBeenCalledTimes(2);
  });
  it('does not retry a permission error as a schema fallback', async () => {
    select.mockReturnValue(query({ data: null, error: { code: '42501' } }));
    const r = await GET(new Request('https://admin.elevateforhumanity.org/api/crm/templates'));
    expect(r.status).toBe(503); expect(select).toHaveBeenCalledOnce();
  });
  it('rejects unauthorized requests before reading templates', async () => {
    auth.mockResolvedValue({ error: Response.json({ error: 'Unauthorized' }, { status: 401 }) });
    const r = await GET(new Request('https://admin.elevateforhumanity.org/api/crm/templates'));
    expect(r.status).toBe(401); expect(client).not.toHaveBeenCalled();
  });
});
