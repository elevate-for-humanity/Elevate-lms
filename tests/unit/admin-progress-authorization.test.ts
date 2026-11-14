import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ guard: vi.fn(), client: vi.fn(), audit: vi.fn() }));
vi.mock('@/lib/admin/guards', () => ({ apiRequireRoles: mocks.guard }));
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.client }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: mocks.client }));
vi.mock('@/lib/audit', () => ({ writeAdminAuditEvent: mocks.audit }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { setLearnerLessonCompletion } from '@/apps/admin/app/students/[id]/progress-actions';

beforeEach(() => vi.clearAllMocks());

describe('administrator progress overrides', () => {
  it('denies a rejected session before any progress database access', async () => {
    mocks.guard.mockResolvedValue({ error: new Response(null, { status: 403 }) });
    const result = await setLearnerLessonCompletion(
      '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', true,
    );
    expect(result.ok).toBe(false);
    expect(mocks.guard).toHaveBeenCalledWith(undefined, ['admin', 'super_admin']);
    expect(mocks.client).not.toHaveBeenCalled();
    expect(mocks.audit).not.toHaveBeenCalled();
  });

  it('rejects malformed IDs before opening a database client', async () => {
    expect(await setLearnerLessonCompletion('bad', 'bad', true)).toEqual({ ok: false, error: 'Invalid lesson.' });
    expect(mocks.client).not.toHaveBeenCalled();
  });
});
