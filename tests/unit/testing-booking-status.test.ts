import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const state = vi.hoisted(() => ({ rows: {} as Record<string, any>, tables: [] as string[] }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: vi.fn(async () => null) }));
vi.mock('@/lib/supabase/admin', () => ({ getAdminClient: vi.fn(async () => ({ from(table: string) {
  state.tables.push(table);
  const q: any = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: state.rows[table], error: null }) };
  return q;
} })) }));
import { GET } from '../../apps/marketing/app/api/testing/booking-status/route';

const id = 'b55dc7d7-56d9-4b6b-8de9-68069a29746a';
const token = 'ed469066-3a3f-4fdd-90b3-6b5d9c195ff4';
const request = (query: string) => new NextRequest(`https://www.elevateforhumanity.org/api/testing/booking-status?${query}`);

describe('private paid testing confirmation', () => {
  beforeEach(() => {
    state.tables = [];
    state.rows = {
      billing_invoices: { id, status:'paid', fulfillment_type:'testing_booking', fulfillment_payload:{ booking_token:token } },
      exam_bookings: { exam_name:'EPA 608', confirmation_code:'EXAM1234', slot_id:id, status:'confirmed' },
      testing_slots: { start_time:'2026-11-07T15:30:00Z', end_time:'2026-11-07T18:00:00Z', location:'Elevate Testing Center', is_cancelled:false },
    };
  });
  it('does not expose bookings by email or guessable provider invoice number', async () => {
    expect((await GET(request('email=student@example.com'))).status).toBe(400);
    expect((await GET(request(`invoice_id=42&booking_token=${token}`))).status).toBe(400);
    expect(state.tables).toEqual([]);
  });
  it('rejects a different private token before reading booking details', async () => {
    const response = await GET(request(`invoice_id=${id}&booking_token=${id}`));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ found:false });
    expect(state.tables).toEqual(['billing_invoices']);
  });
  it('keeps unpaid invoices from unlocking the calendar', async () => {
    state.rows.billing_invoices.status = 'open';
    const response = await GET(request(`invoice_id=${id}&booking_token=${token}`));
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ found:false, paymentPending:true });
    expect(state.tables).toEqual(['billing_invoices']);
  });
  it('does not call a paid but unreserved appointment confirmed', async () => {
    state.rows.exam_bookings = null;
    const response = await GET(request(`invoice_id=${id}&booking_token=${token}`));
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ found:false, paid:true, schedulingPending:true });
  });
  it('returns the reserved Google Calendar time without contact information', async () => {
    const response = await GET(request(`invoice_id=${id}&booking_token=${token}`));
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(data.appointment).toContain('10:30 AM Eastern Time');
    expect(new URL(data.googleCalendarUrl).searchParams.get('dates')).toBe('20261107T153000Z/20261107T180000Z');
    expect(data).not.toHaveProperty('email');
  });
  it('withholds calendar confirmation for a canceled testing session', async () => {
    state.rows.testing_slots.is_cancelled = true;
    const response = await GET(request(`invoice_id=${id}&booking_token=${token}`));
    expect(await response.json()).toEqual({ found:false, paid:true, schedulingPending:true });
  });
});
