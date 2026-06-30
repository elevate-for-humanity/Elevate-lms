import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/testing-center
 * Returns unified dashboard data: bookings, sessions, slots, outcome stats.
 */
export async function GET(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  const url = new URL(request.url);
  const dateFrom = url.searchParams.get('from') ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const dateTo   = url.searchParams.get('to')   ?? new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  const [
    { data: bookings },
    { data: sessions },
    { data: slots },
  ] = await Promise.all([
    db
      .from('exam_bookings')
      .select('id,exam_type,exam_name,first_name,last_name,email,status,confirmed_date,confirmed_time,exam_result,payment_status,fee_cents,created_at,slot_id,attempts_used,no_show_fee_paid')
      .gte('created_at', dateFrom)
      .order('created_at', { ascending: false })
      .limit(200),
    db
      .from('exam_sessions')
      .select('id,student_name,student_email,provider,exam_name,status,result,score,started_at,completed_at,proctor_name,delivery_method,review_status,is_retest,created_at')
      .gte('created_at', dateFrom)
      .order('created_at', { ascending: false })
      .limit(200),
    db
      .from('testing_slots')
      .select('id, exam_type, start_time, end_time, capacity, booked_count, location, notes, is_cancelled')
      .eq('is_cancelled', false)
      .gte('start_time', new Date(Date.now() - 7 * 86400000).toISOString())
      .order('start_time', { ascending: true })
      .limit(60),
  ]);

  // Outcome stats
  const allSessions = sessions ?? [];
  const stats = {
    totalBookings:    (bookings ?? []).length,
    confirmedBookings:(bookings ?? []).filter((b: any) => b.status === 'confirmed').length,
    pendingBookings:  (bookings ?? []).filter((b: any) => b.status === 'pending').length,
    totalSessions:    allSessions.length,
    passed:           allSessions.filter((s: any) => s.result === 'pass').length,
    failed:           allSessions.filter((s: any) => s.result === 'fail').length,
    inProgress:       allSessions.filter((s: any) => s.status === 'in_progress').length,
    flagged:          allSessions.filter((s: any) => s.review_status === 'flagged' || s.review_status === 'under_review').length,
    noShows:          (bookings ?? []).filter((b: any) => b.status === 'no_show').length,
    passRate:         allSessions.filter((s: any) => ['pass','fail'].includes(s.result)).length > 0
      ? Math.round(allSessions.filter((s: any) => s.result === 'pass').length /
          allSessions.filter((s: any) => ['pass','fail'].includes(s.result)).length * 100)
      : null,
  };

  return NextResponse.json({ bookings: bookings ?? [], sessions: sessions ?? [], slots: slots ?? [], stats });
}
