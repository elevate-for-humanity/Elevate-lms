// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({
  role: vi.fn(),
  admin: vi.fn(),
  upsert: vi.fn(),
  update: vi.fn(),
  audit: vi.fn(),
  app: {} as any,
  createError: null as any,
  linkError: null as any,
}));
vi.mock('@/lib/auth/require-role', () => ({ requireRole: state.role }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: state.admin }));
vi.mock('@/lib/admin/audit-log', () => ({
  logAdminAudit: state.audit,
  AdminAction: { APPLICATION_STATUS_CHANGED: 'application.status_changed' },
}));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));
import { beginEmployerOnboarding } from '@/apps/admin/app/employers/applications/[id]/actions';
const id = '11111111-2222-4333-8444-555555555555';
function form() {
  const f = new FormData();
  f.set('applicationId', id);
  return f;
}
beforeEach(() => {
  vi.clearAllMocks();
  state.createError = null;
  state.linkError = null;
  state.app = {
    id,
    company_name: 'Fixture Home Care',
    email: 'contact@fixture.test',
    contact_name: 'Fixture Contact',
    status: 'pending',
    data: { hiring_needs: 'Care workers' },
  };
  state.role.mockResolvedValue({ user: { id: 'admin' } });
  state.upsert.mockImplementation(async () => ({ error: state.createError }));
  state.update.mockImplementation(() => ({
    eq: () => ({
      eq: () => ({
        select: () => ({
          maybeSingle: async () => ({
            data: state.linkError ? null : { id },
            error: state.linkError,
          }),
        }),
      }),
    }),
  }));
  state.admin.mockResolvedValue({
    from: (table: string) =>
      table === 'employers'
        ? { upsert: state.upsert }
        : {
            select: () => ({
              eq: () => ({ single: async () => ({ data: state.app, error: null }) }),
            }),
            update: state.update,
          },
  });
});
it('checks role before any privileged read or write', async () => {
  state.role.mockRejectedValue(new Error('DENIED'));
  await expect(beginEmployerOnboarding(form())).rejects.toThrow('DENIED');
  expect(state.admin).not.toHaveBeenCalled();
});
it('creates a pending employer and links the application using the supported in_review status', async () => {
  await expect(beginEmployerOnboarding(form())).rejects.toThrow(`REDIRECT:/employers/${id}`);
  expect(state.upsert).toHaveBeenCalledWith(
    expect.objectContaining({ id, approved: false, status: 'pending' }),
    { onConflict: 'id', ignoreDuplicates: true },
  );
  expect(state.update).toHaveBeenCalledWith(
    expect.objectContaining({
      status: 'in_review',
      data: expect.objectContaining({ employer_id: id, hiring_needs: 'Care workers' }),
    }),
  );
  expect(state.audit).toHaveBeenCalled();
});
it.each(['rejected', 'approved', 'draft'])(
  'does not create an employer for a %s application',
  async (status) => {
    state.app.status = status;
    await expect(beginEmployerOnboarding(form())).rejects.toThrow('Verify this application');
    expect(state.upsert).not.toHaveBeenCalled();
  },
);
it('rejects placeholder contacts rather than activating seed data', async () => {
  state.app.email = 'fixture@example.com';
  await expect(beginEmployerOnboarding(form())).rejects.toThrow('Verify this application');
  expect(state.upsert).not.toHaveBeenCalled();
});
it('reuses an already linked employer without overwriting approval or access', async () => {
  state.app.data.employer_id = 'existing-employer';
  await expect(beginEmployerOnboarding(form())).rejects.toThrow(
    'REDIRECT:/employers/existing-employer',
  );
  expect(state.upsert).not.toHaveBeenCalled();
  expect(state.update).not.toHaveBeenCalled();
});
it('preserves the application if employer creation fails', async () => {
  state.createError = { message: 'unavailable' };
  await expect(beginEmployerOnboarding(form())).rejects.toThrow('Application preserved');
  expect(state.update).not.toHaveBeenCalled();
});
it('does not report a linked application when the link write fails', async () => {
  state.linkError = { message: 'unavailable' };
  await expect(beginEmployerOnboarding(form())).rejects.toThrow('linking requires retry');
  expect(state.audit).not.toHaveBeenCalled();
});

it('does not promote an incomplete saved draft to employer onboarding', async () => {
 state.app.state = 'draft';
 await expect(beginEmployerOnboarding(form())).rejects.toThrow('Verify this application');
 expect(state.upsert).not.toHaveBeenCalled();
});
