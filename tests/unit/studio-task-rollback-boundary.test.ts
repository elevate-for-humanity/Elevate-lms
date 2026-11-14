import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const state = vi.hoisted(() => ({ authError: null as Response | null, db: vi.fn() }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/devstudio/api-auth', () => ({ apiRequireDevStudio: async () => ({ id: 'admin', error: state.authError }) }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: state.db }));
import { POST } from '@/apps/admin/app/api/admin/dev-studio/tasks/[id]/rollback/route';

beforeEach(() => { state.authError = null; vi.clearAllMocks(); });
const request = () => new NextRequest('https://admin.elevateforhumanity.org/api/admin/dev-studio/tasks/task/rollback', { method: 'POST' });
const context = { params: Promise.resolve({ id: 'task' }) };

describe('Studio task rollback boundary', () => {
  it('never reports restoration or changes task records without a restore implementation', async () => {
    const response = await POST(request(), context);
    expect(response.status).toBe(501);
    expect(await response.json()).toMatchObject({ code: 'TASK_ROLLBACK_UNAVAILABLE' });
    expect(state.db).not.toHaveBeenCalled();
  });
  it('preserves the authenticated access boundary', async () => {
    state.authError = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    expect((await POST(request(), context)).status).toBe(401);
    expect(state.db).not.toHaveBeenCalled();
  });
});
