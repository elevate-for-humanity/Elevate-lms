import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ existing: false, phone: '3175550100', inserts: 0, provision: vi.fn() }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/rate-limit', () => ({ getRedisClient: () => null }));
vi.mock('@/lib/programs/program-state', () => ({ getProgramEnrollmentState: () => 'open' }));
vi.mock('@/lib/email/sendgrid', () => ({ sendEmail: async () => ({ success: true }) }));
vi.mock('@/lib/enrollment/provision-account', () => ({ provisionAccount: state.provision }));
vi.mock('@/lib/audit/withApiAudit', () => ({
  withApiAudit: (_path: string, handler: unknown) => handler,
}));
vi.mock('@/lib/api/withAudit', () => ({ auditMutation: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/supabase/admin', () => ({
  getAdminClient: async () => ({
    from(table: string) {
      let selection = '',
        inserted = false;
      const query: any = {
        select(value: string) {
          selection = value;
          return query;
        },
        eq: () => query,
        neq: () => query,
        gte: () => query,
        not: () => query,
        order: () => query,
        limit: () => query,
        insert() {
          inserted = true;
          if (table === 'applications') state.inserts++;
          return query;
        },
        async maybeSingle() {
          if (table !== 'applications') return { data: null, error: null };
          const saved = {
            id: 'saved-application',
            reference_number: 'EFH-SAVED',
            status: 'submitted',
            program_interest: 'hvac-technician',
            funding_type: null,
            payment_status: null, normalized_phone: state.phone,
          };
          return {
            data:
              inserted ||
              (state.existing && (selection === 'id' || selection.includes('reference_number')))
                ? saved
                : null,
            error: null,
          };
        },
      };
      return query;
    },
  }),
}));
import { POST } from '../../apps/marketing/app/api/applications/route';
const submit = () =>
  POST(
    new Request('https://www.elevateforhumanity.org/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://www.elevateforhumanity.org' },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'Applicant',
        email: 'test@example.test',
        phone: '3175550100',
        program: 'hvac-technician',
      }),
    }),
  );
beforeEach(() => {
  state.existing = false;
  state.phone = '3175550100';
  state.inserts = 0;
  state.provision.mockReset();
});
describe('saved application recovery', () => {
  it('returns the original application on retry instead of rejecting it as a duplicate', async () => {
    state.existing = true;
    const response = await submit();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      existing: true,
      id: 'saved-application',
      referenceNumber: 'EFH-SAVED',
    });
    expect(state.inserts).toBe(0);
    expect(state.provision).not.toHaveBeenCalled();
  });
  it('does not disclose the saved application or create a duplicate when contact information differs', async () => {
    state.existing = true; state.phone = '3175550199';
    const response = await submit();
    expect(response.status).toBe(409);
    expect(await response.json()).not.toHaveProperty('id');
    expect(state.inserts).toBe(0);
  });
  it('confirms the saved application even when account provisioning throws', async () => {
    state.provision.mockRejectedValue(new Error('Auth service temporarily unavailable'));
    const response = await submit();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, id: 'saved-application' });
    expect(state.inserts).toBe(1);
    expect(state.provision).toHaveBeenCalledOnce();
  });
});
