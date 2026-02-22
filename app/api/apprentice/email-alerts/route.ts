import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: Request) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { type, apprenticeshipId, data } = await request.json();

  const { data: apprenticeship } = await db
    .from('apprenticeship_enrollments')
    .select(`
      *,
      student:profiles!apprenticeship_enrollments_student_id_fkey(email, full_name),
      employer:profiles!apprenticeship_enrollments_employer_contact_id_fkey(email, full_name)
    `)
    .eq('id', apprenticeshipId)
    .single();

  if (!apprenticeship) {
    return NextResponse.json({ error: 'Apprenticeship not found' }, { status: 404 });
  }

  const notifications = [];

  switch (type) {
    case 'checkin_reminder':
      notifications.push({
        recipient_id: apprenticeship.student_id,
        notification_type: 'checkin_reminder',
        subject: '⏰ Time to Check In - ' + apprenticeship.employer_name,
        message: `Hi ${apprenticeship.student.full_name},\n\nReminder to check in for your shift at ${apprenticeship.employer_name}.\n\nCheck in now: ${process.env.NEXT_PUBLIC_SITE_URL}/lms/apprenticeship-hours`
      });
      break;

    case 'missed_checkin':
      notifications.push({
        recipient_id: apprenticeship.employer_contact_id,
        notification_type: 'missed_checkin_alert',
        subject: '⚠️ Apprentice Missed Check-In - ' + apprenticeship.student.full_name,
        message: `${apprenticeship.student.full_name} has not checked in today.\n\nExpected check-in time: ${data.expectedTime}\nCurrent time: ${new Date().toLocaleTimeString()}`
      });
      break;

    case 'hours_approved':
      notifications.push({
        recipient_id: apprenticeship.student_id,
        notification_type: 'hours_approved',
        subject: '✅ Your Hours Have Been Approved',
        message: `Hi ${apprenticeship.student.full_name},\n\nYour ${data.hours} hours for ${data.date} have been approved!\n\nTotal hours: ${apprenticeship.total_hours_completed}/${apprenticeship.total_hours_required}\nProgress: ${((apprenticeship.total_hours_completed / apprenticeship.total_hours_required) * 100).toFixed(1)}%`
      });
      break;

    case 'payroll_ready':
      notifications.push({
        recipient_id: apprenticeship.student_id,
        notification_type: 'payroll_ready',
        subject: '💰 Payroll Ready - ' + data.periodEnd,
        message: `Hi ${apprenticeship.student.full_name},\n\nYour payroll is ready:\n\nPeriod: ${data.periodStart} to ${data.periodEnd}\nHours: ${data.hours}\nRate: $${apprenticeship.wage_current}/hr\nGross Pay: $${data.grossPay}`
      });
      break;

    case 'daily_summary':
      const progress = ((data.totalHours / data.requiredHours) * 100).toFixed(1);
      notifications.push({
        recipient_id: apprenticeship.student_id,
        notification_type: 'daily_summary',
        subject: '📊 Daily Hours Summary - ' + data.date,
        message: `Hi ${data.studentName},\n\nHere's your summary for ${data.date}:\n\nCheck-in: ${data.checkInTime}\nCheck-out: ${data.checkOutTime || 'Not yet'}\nHours Today: ${data.todayHours}\n\nTotal Progress:\n${data.totalHours}/${data.requiredHours} hours (${progress}%)\n\nStatus: ${data.approved ? '✅ Approved' : '⏳ Pending approval'}`
      });
      break;
  }

  // Insert notifications
  for (const notif of notifications) {
    await db.from('notification_log').insert(notif);
  }

  return NextResponse.json({ success: true, sent: notifications.length });
}

// Cron endpoint to check for missed check-ins
export async function GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const today = new Date().toISOString().split('T')[0];
  const currentHour = new Date().getHours();

  // Only check during work hours (8 AM - 6 PM)
  if (currentHour < 8 || currentHour > 18) {
    return NextResponse.json({ message: 'Outside work hours' });
  }

  // Find apprentices who haven't checked in today
  const { data: apprenticeships } = await db
    .from('apprenticeship_enrollments')
    .select(`
      *,
      student:profiles!apprenticeship_enrollments_student_id_fkey(email, full_name)
    `)
    .eq('status', 'active');

  let alertsSent = 0;

  for (const apprenticeship of apprenticeships || []) {
    const { data: todayLog } = await db
      .from('ojt_hours_log')
      .select('id')
      .eq('apprenticeship_id', apprenticeship.id)
      .eq('work_date', today)
      .single();

    if (!todayLog && apprenticeship.employer_contact_id) {
      // Send alert
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/apprentice/email-alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'missed_checkin',
          apprenticeshipId: apprenticeship.id,
          data: { expectedTime: '9:00 AM' }
        })
      });
      alertsSent++;
    }
  }

  return NextResponse.json({ alertsSent });
}
