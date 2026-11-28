// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Pins the 2026-11-28 inquiry-persistence repair (coordinator #24 audit):
// public.inquiries has NO name/email/phone columns — its contract is
// (inquiry_type NOT NULL, data jsonb NOT NULL, funding_type,
// program_interest, source, status). Both /api/program-inquiry and
// /api/inquiry inserted the flat fields, PostgREST rejected every insert,
// neither route checked the returned { error }, and both still returned
// success and sent notification emails — public.inquiries had 0 rows ever.
// These tests pin (a) the aligned insert shape and (b) a 500 with NO
// notification emails when persistence fails.

const insertedPayloads: Record<string, any>[] = [];
const sentEmails: Record<string, any>[] = [];
let insertError: any = null;

const fakeDb = {
  from(_table: string) {
    return {
      insert: async (payload: Record<string, any>) => {
        insertedPayloads.push(payload);
        return { data: null, error: insertError };
      },
    };
  },
};

vi.mock('@/lib/supabase/server', () => ({ createClient: async () => fakeDb }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/audit/withApiAudit', () => ({ withApiAudit: (_name: string, handler: any) => handler }));
vi.mock('@/lib/logger', () => ({ logger: { info: () => undefined, warn: () => undefined, error: () => undefined } }));
vi.mock('@/lib/email/sendgrid', () => ({
  sendEmail: async (msg: Record<string, any>) => { sentEmails.push(msg); return { success: true }; },
}));
vi.mock('@/lib/crm/lead-scoring', () => ({
  scoreLead: async () => ({ total: 42, grade: 'B' }),
  updateLeadScore: async () => undefined,
}));

import { POST as programInquiryPOST } from '@/apps/marketing/app/api/program-inquiry/route';
import { POST as inquiryPOST } from '@/apps/marketing/app/api/inquiry/route';

function jsonRequest(url: string, body: Record<string, any>) {
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

beforeEach(() => {
  insertedPayloads.length = 0;
  sentEmails.length = 0;
  insertError = null;
});

describe('POST /api/program-inquiry — inquiries table contract', () => {
  it('inserts inquiry_type + data jsonb + shared columns, never the flat fields', async () => {
    const res = await programInquiryPOST(jsonRequest('https://www.elevateforhumanity.org/api/program-inquiry', {
      name: 'Test Applicant', email: 'applicant@example.com', phone: '3175550100',
      program: 'hvac-technician', question: 'When does the next cohort start?',
    }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(insertedPayloads).toHaveLength(1);
    const payload = insertedPayloads[0];
    expect(payload).toMatchObject({
      inquiry_type: 'program_inquiry',
      program_interest: 'hvac-technician',
      funding_type: 'workforce-funded',
      status: 'new',
      source: 'website_program_inquiry',
    });
    expect(payload.data).toEqual({
      name: 'Test Applicant', email: 'applicant@example.com', phone: '3175550100',
      question: 'When does the next cohort start?',
    });
    expect(payload).not.toHaveProperty('name');
    expect(payload).not.toHaveProperty('email');
    expect(payload).not.toHaveProperty('phone');
    expect(sentEmails).toHaveLength(2);
  });

  it('returns 500 and sends no notification emails when the insert fails', async () => {
    insertError = { message: 'column inquiries.name does not exist', code: 'PGRST204' };
    const res = await programInquiryPOST(jsonRequest('https://www.elevateforhumanity.org/api/program-inquiry', {
      name: 'Test Applicant', email: 'applicant@example.com', phone: '3175550100',
      program: 'hvac-technician', question: '',
    }));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.ok).not.toBe(true);
    expect(sentEmails).toHaveLength(0);
  });
});

describe('POST /api/inquiry — inquiries table contract', () => {
  it('inserts inquiry_type + data jsonb + shared columns, never the flat fields', async () => {
    const res = await inquiryPOST(jsonRequest('https://www.elevateforhumanity.org/api/inquiry', {
      name: 'Test Applicant', email: 'applicant@example.com', phone: '3175550100',
      program: 'HVAC Technician', funding: 'wioa',
    }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(insertedPayloads).toHaveLength(1);
    const payload = insertedPayloads[0];
    expect(payload).toMatchObject({
      inquiry_type: 'website_inquiry',
      program_interest: 'HVAC Technician',
      funding_type: 'wioa',
      status: 'new',
      source: 'website',
    });
    expect(payload.data).toEqual({
      name: 'Test Applicant', email: 'applicant@example.com', phone: '3175550100',
    });
    expect(payload).not.toHaveProperty('name');
    expect(payload).not.toHaveProperty('email');
    expect(payload).not.toHaveProperty('phone');
    expect(sentEmails.length).toBeGreaterThan(0);
  });

  it('returns 500 and sends no notification emails when the insert fails', async () => {
    insertError = { message: 'column inquiries.name does not exist', code: 'PGRST204' };
    const res = await inquiryPOST(jsonRequest('https://www.elevateforhumanity.org/api/inquiry', {
      name: 'Test Applicant', email: 'applicant@example.com', phone: '3175550100',
      program: 'HVAC Technician', funding: 'wioa',
    }));
    expect(res.status).toBe(500);
    expect(sentEmails).toHaveLength(0);
  });
});
