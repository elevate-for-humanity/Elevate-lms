// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ db: null as any }));
vi.mock('@/lib/devstudio/api-auth', () => ({ apiRequireDevStudio: async () => ({ userId: 'owner' }) }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => mocks.db }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }) } }) }));
vi.mock('@/lib/api/safe-error', () => ({ safeError: (error: string, status: number) => Response.json({ error }, { status }), safeInternalError: () => Response.json({}, { status: 500 }) }));
import { PATCH, POST } from '@/apps/admin/app/api/admin/dev-studio/jobs/route';
const id = '12345678-1234-1234-1234-123456789abc';
const request = (body: unknown, method = 'PATCH') => new NextRequest('http://localhost/api/admin/dev-studio/jobs', { method, body: JSON.stringify(body) });
let chain: any;
beforeEach(() => {
  chain = { select: vi.fn(() => chain), eq: vi.fn(() => chain), maybeSingle: vi.fn(async () => ({ data: { id }, error: null })), update: vi.fn(() => chain), insert: vi.fn(() => chain), single: vi.fn(async () => ({ data: null, error: { code: '42P01' } })) };
  mocks.db = { from: vi.fn(() => chain), rpc: vi.fn(async () => ({ data: null, error: null })) };
});
it('rejects temporary and absent job IDs without reporting success', async () => {
  for (const jobId of [undefined, 'temp-1', 12]) expect((await PATCH(request({ jobId }))).status).toBe(400);
  expect(mocks.db.from).not.toHaveBeenCalled();
});
it('requires ownership before any log mutation', async () => {
  chain.maybeSingle.mockResolvedValue({ data: null, error: null });
  expect((await PATCH(request({ jobId: id, lines: ['hello'] }))).status).toBe(404);
  expect(chain.eq).toHaveBeenCalledWith('user_id', 'owner');
  expect(mocks.db.rpc).not.toHaveBeenCalled();
});
it('accepts a successful void log RPC and surfaces RPC failure', async () => {
  expect((await PATCH(request({ jobId: id, lines: ['hello'] }))).status).toBe(200);
  mocks.db.rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202' } });
  expect((await PATCH(request({ jobId: id, lines: ['hello'] }))).status).toBe(500);
  expect(chain.update).not.toHaveBeenCalled();
});
it('surfaces failed database writes', async () => {
  chain.maybeSingle.mockResolvedValueOnce({ data: { id }, error: null }).mockResolvedValueOnce({ data: null, error: { code: 'XX000' } });
  expect((await PATCH(request({ jobId: id, status: 'completed' }))).status).toBe(500);
});
it('rejects invalid input before database access', async () => {
  for (const fields of [{ lines: [4] }, { status: 'invented' }, { finished_at: 'bad-date' }]) expect((await PATCH(request({ jobId: id, ...fields }))).status).toBe(400);
  expect(mocks.db.from).not.toHaveBeenCalled();
});
it('does not manufacture job IDs when storage is missing', async () => {
  expect((await POST(request({ command: 'inspect' }, 'POST'))).status).toBe(503);
  expect((await POST(request({ command: 4 }, 'POST'))).status).toBe(400);
});

import { GET as events } from '@/apps/admin/app/api/admin/dev-studio/events/route';
it('reports event query failures with an error status', async () => {
  chain.order = vi.fn(() => chain);
  chain.limit = vi.fn(async () => ({ data: null, error: { code: '42P01' } }));
  expect((await events(new NextRequest('http://localhost/api/admin/dev-studio/events?limit=NaN'))).status).toBe(503);
  expect(chain.limit).toHaveBeenCalledWith(30);
});
it('rejects invalid event timestamps before database access', async () => {
  expect((await events(new NextRequest('http://localhost/api/admin/dev-studio/events?since=invalid'))).status).toBe(400);
  expect(mocks.db.from).not.toHaveBeenCalled();
});
