// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Pins the 2026-11-28 application-flow repair (owner-directed):
//  - intake submissions persist into public.applications (they were silently
//    diverted to CRM leads from 2026-11-07 to 2026-11-28),
//  - intake lands on the confirmation page, never the payment page,
//  - workforce-funded applicants (WIOA/WRG/JRI/employer) are never
//    deposit-gated, apprentices included,
//  - an unpaid self-pay full enrollment still cannot submit (402).

const insertedPayloads: Record<string, any>[] = [];

const PROGRAMS: Record<string, any> = {
  'hvac-technician': { id: 'prog-hvac', slug: 'hvac-technician', title: 'HVAC Technician', is_apprenticeship: false, is_free: false, price: 5000, tuition: 5000, total_cost: 5000 },
  'barber-apprenticeship': { id: 'prog-barber', slug: 'barber-apprenticeship', title: 'Barber Apprenticeship', is_apprenticeship: true, is_free: false, price: 4980, tuition: 4980, total_cost: 4980 },
};

function makeDb() {
  return {
    from(table: string) {
      let op = 'select';
      let payload: any = null;
      const chain: any = {
        select: () => chain,
        eq: () => chain,
        neq: () => chain,
        or: () => chain,
        not: () => chain,
        order: () => chain,
        gte: () => chain,
        lt: () => chain,
        lte: () => chain,
        is: () => chain,
        limit: () => chain,
        range: () => chain,
        in: () => chain,
        insert: (p: any) => { op = 'insert'; payload = p; return chain; },
        update: (p: any) => { op = 'update'; payload = p; return chain; },
        maybeSingle: async () => {
          if (table === 'programs') {
            const slug = (makeDb as any)._slug as string;
            return { data: PROGRAMS[slug] || null, error: null };
          }
          if (table === 'applications' && op === 'insert') {
            insertedPayloads.push(payload);
            return { data: { id: 'app-1', email: payload.email, program_interest: payload.program_interest }, error: null };
          }
          return { data: null, error: null };
        },
        single: async () => ({ data: { id: 'row-1' }, error: null }),
        then: (res: any, rej: any) =>
          Promise.resolve(table === 'applications' && op === 'select' ? { data: [], error: null } : { data: null, error: null }).then(res, rej),
      };
      return chain;
    },
  };
}

let currentSlug = 'hvac-technician';

vi.mock('@/lib/supabase/admin', () => ({
  getAdminClient: async () => { (makeDb as any)._slug = currentSlug; return makeDb(); },
}));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/logger', () => ({ logger: { info: () => undefined, warn: () => undefined, error: () => undefined } }));
vi.mock('@/lib/rate-limit', () => ({ getRedisClient: () => null }));
vi.mock('@/lib/audit/withApiAudit', () => ({ withApiAudit: (_name: string, handler: any) => handler }));
vi.mock('@/lib/email/sendgrid', () => ({ sendEmail: async () => ({ success: true }) }));
vi.mock('@/lib/admissions/status-emails', () => ({ logCommunication: async () => undefined }));
vi.mock('@/lib/admissions/queue-application-submission', () => ({ enqueueApplicationSubmission: async () => undefined }));
vi.mock('@/lib/program-holder/application-copy', () => ({ copyApplicationToProgramHolders: async () => undefined }));
vi.mock('@/lib/enrollment/provision-account', () => ({ provisionAccount: async () => ({ userId: null, passwordSetupLink: null }) }));
vi.mock('@/lib/enrollment/paid-application', () => ({ verifyPaidApplication: async () => false, activatePaidApplication: async () => null }));
vi.mock('@/lib/programs/program-state', () => ({ getProgramEnrollmentState: async () => 'open' }));

import { POST } from '@/apps/marketing/app/api/applications/route';

function submit(body: Record<string, any>) {
  const req = new Request('https://www.elevateforhumanity.org/api/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://www.elevateforhumanity.org' },
    body: JSON.stringify({
      firstName: 'Test', lastName: 'Applicant', email: 'applicant@example.com', phone: '3175550100',
      dateOfBirth: '1995-01-15', address: '1 Main St', city: 'Indianapolis', state: 'IN', zip: '46204',
      program: currentSlug, programSlug: currentSlug, applicationCertification: true,
      ...body,
    }),
  });
  return POST(req as any);
}

beforeEach(() => { insertedPayloads.length = 0; currentSlug = 'hvac-technician'; });

describe('POST /api/applications — intake persistence and funding branch', () => {
  it('persists an intake submission as an application and confirms, never redirecting to payment', async () => {
    const res = await submit({ applicationIntent: 'inquiry', fundingType: 'self_pay', source: 'intake-form' });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(insertedPayloads).toHaveLength(1);
    expect(insertedPayloads[0]).toMatchObject({ intake_stage: 'inquiry', source: 'intake-form', status: 'submitted' });
    expect(data.ok).toBe(true);
    expect(data.referenceNumber).toBeTruthy();
    expect(data.nextStepUrl).toMatch(/^\/apply\/success/);
    expect(data.nextStepUrl).not.toContain('/enroll/');
    expect(data.nextStepUrl).not.toContain('payment');
    expect(data.recordType).not.toBe('lead');
  });

  it('routes a WIOA intake with WorkOne steps outstanding to pending_workone, not the payment page', async () => {
    const res = await submit({ applicationIntent: 'inquiry', fundingType: 'wioa', source: 'intake-form', hasWorkOneReferral: 'no', workoneIntakeCompleted: 'not_started' });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(insertedPayloads[0]).toMatchObject({ status: 'pending_workone', funding_type: 'wioa' });
    expect(data.nextStepUrl).toMatch(/^\/apply\/pending-workone/);
  });

  it('accepts a funded full enrollment without payment and parks it in Admissions review', async () => {
    const res = await submit({ applicationIntent: 'enrollment', fundingType: 'wioa', source: 'student-application' });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(insertedPayloads[0]).toMatchObject({ intake_stage: 'enrollment', status: 'pending_admin_review' });
    expect(data.applicationStatus).toBe('pending_admin_review');
    expect(data.nextStepUrl).toMatch(/^\/apply\/success/);
  });

  it('accepts an employer-sponsored enrollment without a deposit', async () => {
    const res = await submit({ applicationIntent: 'enrollment', fundingType: 'employer_sponsored', source: 'student-application' });
    expect(res.status).toBe(200);
    expect(insertedPayloads[0]).toMatchObject({ status: 'pending_admin_review', funding_type: 'employer_sponsored' });
  });

  it('still refuses an unpaid self-pay full enrollment (402, nothing saved)', async () => {
    const res = await submit({ applicationIntent: 'enrollment', fundingType: 'self_pay', source: 'student-application' });
    const data = await res.json();
    expect(res.status).toBe(402);
    expect(data.paymentRequired).toBe(true);
    expect(insertedPayloads).toHaveLength(0);
  });

  it('never rewrites a funded apprenticeship application to self-pay', async () => {
    currentSlug = 'barber-apprenticeship';
    const res = await submit({ applicationIntent: 'inquiry', fundingType: 'wioa', source: 'intake-form', hasWorkOneReferral: 'yes', workoneIntakeCompleted: 'in_process' });
    expect(res.status).toBe(200);
    expect(insertedPayloads[0]).toMatchObject({ funding_type: 'wioa', status: 'pending_admin_review' });
  });
});
