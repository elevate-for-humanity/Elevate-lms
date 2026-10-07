// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  holderId: 'holder-a' as string | null,
  holder: { status: 'approved', approved_at: '2026-09-30', mou_signed: false } as Record<string, unknown> | null,
  tables: [] as string[],
}));
vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));
vi.mock('@/lib/admin/portal-preview', () => ({ resolvePortalPreviewSubject: async () => ({ previewing: false }) }));
vi.mock('@/lib/auth/portal-access', () => ({ requirePortalAccess: async () => ({
  isPlatformAdmin: false, user: { id: 'owner-a' },
  profile: { id: 'owner-a', role: 'program_holder', program_holder_id: state.holderId },
}) }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({
  from(table: string) {
    state.tables.push(table);
    const query = {
      select: () => query, eq: () => query,
      maybeSingle: async () => ({ data: state.holder, error: null }),
      then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve({ data: [{ program_id: 'program-a' }], error: null })),
    };
    return query;
  },
}) }));

import { PROGRAM_HOLDER_PENDING_APPLICATION_URL, requireProgramHolder } from '@/lib/auth/require-program-holder';
import OnboardingPage from '@/apps/lms/app/program-holder/onboarding/page';

beforeEach(() => {
  state.holderId = 'holder-a';
  state.holder = { status: 'approved', approved_at: '2026-09-30', mou_signed: false };
  state.tables = [];
});

describe('Program Holder pending approval boundary', () => {
  it.each(['pending', 'rejected', 'archived', 'inactive'])('denies %s without reentering protected onboarding', async status => {
    state.holder!.status = status;
    await expect(requireProgramHolder()).rejects.toThrow(`REDIRECT:${PROGRAM_HOLDER_PENDING_APPLICATION_URL}`);
    expect(state.tables).not.toContain('program_holder_programs');
  });
  it('denies a missing approval timestamp even when status says approved', async () => {
    state.holder!.approved_at = null;
    await expect(requireProgramHolder()).rejects.toThrow(`REDIRECT:${PROGRAM_HOLDER_PENDING_APPLICATION_URL}`);
    expect(state.tables).not.toContain('program_holder_programs');
  });
  it('denies a missing holder relationship without redirecting to a missing LMS page', async () => {
    state.holderId = null;
    await expect(requireProgramHolder()).rejects.toThrow(`REDIRECT:${PROGRAM_HOLDER_PENDING_APPLICATION_URL}`);
    expect(state.tables).toEqual([]);
  });
  it('denies a deleted holder without resolving its program records', async () => {
    state.holder = null;
    await expect(requireProgramHolder()).rejects.toThrow(`REDIRECT:${PROGRAM_HOLDER_PENDING_APPLICATION_URL}`);
    expect(state.tables).toEqual(['program_holders']);
  });
  it.each(['approved', 'active', 'approved_pending_mou'])('keeps %s accounts scoped while an unsigned MOU is completed', async status => {
    state.holder!.status = status;
    const context = await requireProgramHolder();
    expect(context).toMatchObject({ mode: 'holder', holderId: 'holder-a', programIds: ['program-a'] });
  });
  it('sends approved pending-MOU holders to signing rather than a pending-approval dashboard', async () => {
    state.holder!.status = 'approved_pending_mou';
    await expect(OnboardingPage()).rejects.toThrow('REDIRECT:/program-holder/sign-mou');
  });
});
