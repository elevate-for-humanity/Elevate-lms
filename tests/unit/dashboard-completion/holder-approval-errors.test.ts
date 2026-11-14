// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
const state = vi.hoisted(() => ({ guard: vi.fn(), admin: vi.fn(), email: vi.fn() }));
vi.mock('@/lib/admin/guards', () => ({ apiRequireRoles: state.guard }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: state.admin }));
vi.mock('@/lib/email/sendgrid', () => ({ sendEmail: state.email }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/integrations/quickbooks-program-holder-contractor', () => ({
  ensureProgramHolderQuickBooksContractor: vi.fn(),
}));
import { POST } from '@/apps/admin/app/api/program-holder/applications/[id]/approve/route';
beforeEach(() => {
  vi.clearAllMocks();
  state.guard.mockResolvedValue({ id: 'admin', email: 'admin@example.invalid' });
});
it('does not expose internal errors or transmit mail when provisioning fails', async () => {
  state.admin.mockRejectedValue(new Error('sensitive database/provider detail'));
  const response = await POST(
    new NextRequest('https://admin.example/api/program-holder/applications/id/approve', {
      method: 'POST',
    }),
    { params: Promise.resolve({ id: 'application' }) },
  );
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({
    error: 'Unable to approve Program Holder application.',
    code: 'PROGRAM_HOLDER_APPROVAL_FAILED',
  });
  expect(state.email).not.toHaveBeenCalled();
});
it('honors the canonical account/role denial before loading privileged records', async () => {
  state.guard.mockResolvedValue({
    error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
  });
  expect(
    (
      await POST(
        new NextRequest('https://admin.example/api/program-holder/applications/id/approve', {
          method: 'POST',
        }),
        { params: Promise.resolve({ id: 'application' }) },
      )
    ).status,
  ).toBe(401);
  expect(state.admin).not.toHaveBeenCalled();
  expect(state.email).not.toHaveBeenCalled();
});
