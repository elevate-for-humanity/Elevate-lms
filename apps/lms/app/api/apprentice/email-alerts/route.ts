import { requireAdminClient } from '@/lib/supabase/admin';
import { withRuntime } from '@/lib/api/withRuntime';

import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get('authorization') === `Bearer ${secret}`;
}

async function _POST(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await requireAdminClient();
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload.apprenticeshipId !== 'string' ||
      !['checkin_reminder', 'missed_checkin', 'hours_approved', 'payroll_ready', 'daily_summary'].includes(payload.type)) {
    return NextResponse.json({ error: 'Valid alert type and apprenticeship required' }, { status: 400 });
  }
  const { type, apprenticeshipId } = payload;
  const data = payload.data && typeof payload.data === 'object' ? payload.data : {};

  const { data: apprenticeship, error: lookupError } = await supabase
    .from('program_enrollments')
    .select(
      `
      *,
      student:profiles!program_enrollments_student_id_profiles_fkey(email, full_name),
      employer:employers!program_enrollments_employer_id_fkey(owner_user_id, contact_email, contact_name)
    `,
    )
    .eq('id', apprenticeshipId)
    .maybeSingle();

  if (lookupError) return NextResponse.json({ error: 'Apprenticeship data unavailable' }, { status: 503 });
  if (!apprenticeship) {
    return NextResponse.json({ error: 'Apprenticeship not found' }, { status: 404 });
  }

  const notifications: Array<{
    user_id: string;
    type: string;
    title: string;
    body: string;
    status: string;
    sent_at: string;
  }> = [];

  const now = new Date().toISOString();
  const studentName = apprenticeship.student?.full_name || 'Learner';
  const employerName = apprenticeship.employer_name || apprenticeship.employer?.contact_name || 'your host shop';
  if (type === 'missed_checkin' && !apprenticeship.employer?.owner_user_id) {
    return NextResponse.json({ error: 'Host notification recipient is not configured' }, { status: 409 });
  }

  switch (type) {
    case 'checkin_reminder':
      notifications.push({
        user_id: apprenticeship.student_id,
        type: 'checkin_reminder',
        title: '⏰ Time to Check In - ' + employerName,
        body: `Hi ${studentName},\n\nReminder to check in for your shift at ${employerName}.\n\nCheck in now: ${process.env.NEXT_PUBLIC_SITE_URL}/lms/apprenticeship-hours`,
        status: 'sent',
        sent_at: now,
      });
      break;

    case 'missed_checkin':
      notifications.push({
        user_id: apprenticeship.employer.owner_user_id,
        type: 'missed_checkin_alert',
        title: '⚠️ Apprentice Missed Check-In - ' + studentName,
        body: `${studentName} has not checked in today.\n\nExpected check-in time: ${data.expectedTime || 'scheduled shift'}\nCurrent time: ${new Date().toLocaleTimeString()}`,
        status: 'sent',
        sent_at: now,
      });
      break;

    case 'hours_approved':
      notifications.push({
        user_id: apprenticeship.student_id,
        type: 'hours_approved',
        title: '✅ Your Hours Have Been Approved',
        body: `Hi ${studentName},\n\nYour ${data.hours} hours for ${data.date} have been approved!\n\nTotal hours: ${apprenticeship.total_hours_completed}/${apprenticeship.total_hours_required}\nProgress: ${((apprenticeship.total_hours_completed / apprenticeship.total_hours_required) * 100).toFixed(1)}%`,
        status: 'sent',
        sent_at: now,
      });
      break;

    case 'payroll_ready':
      notifications.push({
        user_id: apprenticeship.student_id,
        type: 'payroll_ready',
        title: '💰 Payroll Ready - ' + data.periodEnd,
        body: `Hi ${studentName},\n\nYour payroll is ready:\n\nPeriod: ${data.periodStart} to ${data.periodEnd}\nHours: ${data.hours}\nRate: $${apprenticeship.wage_current}/hr\nGross Pay: $${data.grossPay}`,
        status: 'sent',
        sent_at: now,
      });
      break;

    case 'daily_summary': {
      const progress = ((data.totalHours / data.requiredHours) * 100).toFixed(1);
      notifications.push({
        user_id: apprenticeship.student_id,
        type: 'daily_summary',
        title: '📊 Daily Hours Summary - ' + data.date,
        body: `Hi ${data.studentName},\n\nHere's your summary for ${data.date}:\n\nCheck-in: ${data.checkInTime}\nCheck-out: ${data.checkOutTime || 'Not yet'}\nHours Today: ${data.todayHours}\n\nTotal Progress:\n${data.totalHours}/${data.requiredHours} hours (${progress}%)\n\nStatus: ${data.approved ? '✅ Approved' : '⏳ Pending approval'}`,
        status: 'sent',
        sent_at: now,
      });
      break;
    }
  }

  // Insert notifications into the canonical notification_logs table
  for (const notif of notifications) {
    const { error } = await supabase.from('notification_logs').insert(notif);
    if (error) return NextResponse.json({ error: 'Notification could not be saved' }, { status: 503 });
  }

  return NextResponse.json({ success: true, sent: notifications.length });
}

// Cron endpoint to check for missed check-ins
async function _GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const supabase = await requireAdminClient();
  const today = new Date().toISOString().split('T')[0];
  const currentHour = new Date().getHours();

  // Only check during work hours (8 AM - 6 PM)
  if (currentHour < 8 || currentHour > 18) {
    return NextResponse.json({ message: 'Outside work hours' });
  }

  // Find apprentices who haven't checked in today
  const { data: apprenticeships } = await supabase
    .from('program_enrollments')
    .select(
      `
      *,
      student:profiles!program_enrollments_student_id_profiles_fkey(email, full_name),
      employer:employers!program_enrollments_employer_id_fkey(owner_user_id)
    `,
    )
    .eq('status', 'active')
    .eq('enrollment_type', 'apprentice');

  let alertsSent = 0;

  for (const apprenticeship of apprenticeships || []) {
    const { data: todayLog } = await supabase
      .from('ojt_hours_log')
      .select('id')
      .eq('apprenticeship_id', apprenticeship.id)
      .eq('work_date', today)
      .maybeSingle();

    if (!todayLog && apprenticeship.employer?.owner_user_id) {
      // Send alert
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/apprentice/email-alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${process.env.CRON_SECRET}` },
        body: JSON.stringify({
          type: 'missed_checkin',
          apprenticeshipId: apprenticeship.id,
          data: { expectedTime: '9:00 AM' },
        }),
      });
      alertsSent++;
    }
  }

  return NextResponse.json({ alertsSent });
}
export const GET = withRuntime(withApiAudit('/api/apprentice/email-alerts', _GET));
export const POST = withRuntime(withApiAudit('/api/apprentice/email-alerts', _POST));
