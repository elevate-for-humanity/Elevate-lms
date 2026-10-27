import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({ failed: '', chat: vi.fn(), tables: [] as string[] }));
vi.mock('@/lib/admin/guards', () => ({ apiRequireAdmin: async () => ({ id: 'admin', error: null }) }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/secrets', () => ({ getDecryptedPlatformSecret: async () => undefined }));
vi.mock('@/lib/ellie/actions', () => ({ ELLIE_ACTION_REGISTRY: {} }));
vi.mock('@/lib/ai/ai-service', () => ({ aiChat: state.chat }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ from: (table: string) => {
  state.tables.push(table);
  const q: any = { select: () => q, insert: () => q, eq: () => q, neq: () => q, in: () => q, is: () => q, or: () => q, gt: () => q, gte: () => q, order: () => q, limit: () => q,
    then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => Promise.resolve({ count: 0, error: state.failed === table ? { message: 'Unavailable' } : null, data: table === 'employers' ? [{ company_name: 'Verified Business', contact_name: 'Contact', email: 'office@example.invalid', status: 'active' }] : [] }).then(resolve, reject),
  }; return q;
} }) }));
import { POST } from '@/apps/admin/app/api/admin/ai-assistant/route';
const request = (message: string) => new NextRequest('https://admin.example.test/api/admin/ai-assistant', { method: 'POST', body: JSON.stringify({ message }) });
beforeEach(() => { state.failed = ''; state.tables = []; state.chat.mockReset(); state.chat.mockResolvedValue({ content: 'Reviewed the available records.' }); });
it('marks failed live reads unavailable instead of feeding false zero counts to the assistant', async () => {
  state.failed = 'applications';
  expect((await POST(request('overview'))).status).toBe(200);
  const prompt = state.chat.mock.calls[0][0].messages[0].content;
  expect(prompt).toContain('Pending review: unavailable');
  expect(prompt).toContain('Total applications: unavailable');
});
it('uses the connected employer records for employer lookups', async () => {
  expect((await POST(request('employers'))).status).toBe(200);
  expect(state.tables).not.toContain('employer_profiles');
  expect(state.chat.mock.calls[0][0].messages[0].content).toContain('Verified Business');
});
