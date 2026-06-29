import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/authGuards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import TestingCenterClient from './TestingCenterClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Testing Center | Admin | Elevate For Humanity',
};

export default async function TestingCenterPage() {
  await requireAdmin();
  const db = await requireAdminClient();

  const dateFrom = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const dateTo   = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

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

  const allSessions = sessions ?? [];
  const allBookings = bookings ?? [];

  const stats = {
    totalBookings:     allBookings.length,
    confirmedBookings: allBookings.filter((b: any) => b.status === 'confirmed').length,
    pendingBookings:   allBookings.filter((b: any) => b.status === 'pending').length,
    totalSessions:     allSessions.length,
    passed:            allSessions.filter((s: any) => s.result === 'pass').length,
    failed:            allSessions.filter((s: any) => s.result === 'fail').length,
    inProgress:        allSessions.filter((s: any) => s.status === 'in_progress').length,
    flagged:           allSessions.filter((s: any) => ['flagged','under_review'].includes(s.review_status)).length,
    noShows:           allBookings.filter((b: any) => b.status === 'no_show').length,
    passRate: allSessions.filter((s: any) => ['pass','fail'].includes(s.result)).length > 0
      ? Math.round(
          allSessions.filter((s: any) => s.result === 'pass').length /
          allSessions.filter((s: any) => ['pass','fail'].includes(s.result)).length * 100,
        )
      : null,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Testing Center' }]} />
        <TestingCenterClient
          bookings={allBookings}
          sessions={allSessions}
          slots={slots ?? []}
          stats={stats}
        />
      </div>
    </div>
  );
}
