// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ receipt: {} as any, notify: vi.fn(), admin: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ getAdminClient: state.admin }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('@/lib/applications/submission-notifications', () => ({
  notifyApplicationSubmission: state.notify,
}));
import { POST } from '@/apps/marketing/app/api/employer/apply/route';
beforeEach(() => {
  vi.clearAllMocks();
  state.receipt = {
    status: 'processed',
    destination_table: 'employer_applications',
    destination_id: 'saved-application',
  };
  state.notify.mockResolvedValue({ applicant: 'sent', staff: 'sent' });
  state.admin.mockResolvedValue({
    from: () => ({
      insert: () => ({
        select: () => ({
          maybeSingle: async () => ({ data: { id: 'saved-intake' }, error: null }),
        }),
      }),
      select: () => ({
        eq: () => ({ single: async () => ({ data: state.receipt, error: null }) }),
      }),
    }),
  });
});
function request() {
  return new Request('https://www.elevateforhumanity.org/api/employer/apply', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      companyName: 'Fixture Home Care',
      contactName: 'Fixture Contact',
      email: 'contact@fixture.test',
    }),
  });
}
it('acknowledges receipt only after promotion and links staff to the actual application', async () => {
  const response = await POST(request());
  expect(response.status).toBe(201);
  expect(state.notify).toHaveBeenCalledWith(
    expect.objectContaining({
      staffHtml: expect.stringContaining('/employers/applications/saved-application'),
    }),
  );
});
it.each([
  { status: 'received', destination_table: null, destination_id: null },
  { status: 'processed', destination_table: 'staff_applications', destination_id: 'wrong' },
  { status: 'processed', destination_table: 'employer_applications', destination_id: null },
])('returns a recovery reference without sending a false confirmation for %j', async (receipt) => {
  state.receipt = receipt;
  const response = await POST(request());
  expect(response.status).toBe(503);
  const body = await response.json();
  expect(body.ok).toBe(false);
  expect(body.referenceNumber).toBe('saved-intake');
  expect(state.notify).not.toHaveBeenCalled();
});
