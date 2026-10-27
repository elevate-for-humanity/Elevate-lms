import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({ user: { id: 'owner' } as { id: string } | null, error: false, tables: [] as string[], writes: vi.fn() }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/audit/withApiAudit', () => ({ withApiAudit: (_path: string, handler: unknown) => handler }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({
  auth: { getUser: async () => ({ data: { user: state.user }, error: null }) },
  from: (table: string) => {
    state.tables.push(table);
    const q: any = { select: () => q, eq: () => q, order: () => q, limit: () => q, insert: state.writes,
      maybeSingle: async () => ({ data: state.error ? null : { id: 'session', user_id: 'owner', session_data: { messages: [{ role: 'user', content: 'Career goals' }] } }, error: state.error ? { message: 'Unavailable' } : null }),
    }; return q;
  },
}) }));
import { GET } from '@/apps/admin/app/api/paris/session/route';
const request = () => new NextRequest('https://admin.example.test/api/paris/session');
beforeEach(() => { state.user = { id: 'owner' }; state.error = false; state.tables = []; state.writes.mockClear(); });
it('returns conversation history from the owned session document', async () => {
  const response = await GET(request());
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ messages: [{ role: 'user', content: 'Career goals' }] });
  expect(state.tables).toEqual(['ai_interview_sessions']);
});
it('does not create a replacement session when its lookup failed', async () => {
  state.error = true;
  expect((await GET(request())).status).toBe(503);
  expect(state.writes).not.toHaveBeenCalled();
});
it('requires authentication before reading session records', async () => {
  state.user = null;
  expect((await GET(request())).status).toBe(401);
  expect(state.tables).toEqual([]);
});
