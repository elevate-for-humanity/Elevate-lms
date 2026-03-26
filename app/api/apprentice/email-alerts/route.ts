import { createClient } from '@/lib/supabase/server';

import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(request: Request) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { type, apprenticeshipId, data } = await request.json();

  const { data: apprenticeship } = await supabase
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

  const notifications: Array<{
    user_id: string;
    type: string;
    title: string;
    body: string;
    status: string;
    sent_at: string;
  }> = [];

  const now = new Date().toISOString();

  switch (type) {
    case 'checkin_reminder':
      notifications.push({
        user_id: apprenticeship.student_id,
        type: 'checkin_reminder',
        title: '⏰ Time to Check In - ' + apprenticeship.employer_name,
        body: `Hi ${apprenticeship.student.full_name},\n\nReminder to check in for your shift at ${apprenticeship.employer_name}.\n\nCheck in now: ${process.env.NEXT_PUBLIC_SITE_URL}/lms/apprenticeship-hours`,
        status: 'sent',
        sent_at: now,
      });
      break;

    case 'missed_checkin':
      notifications.push({
        user_id: apprenticeship.employer_contact_id,
        type: 'missed_checkin_alert',
        title: '⚠️ Apprentice Missed Check-In - ' + apprenticeship.student.full_name,
        body: `${apprenticeship.student.full_name} has not checked in today.\n\nExpected check-in time: ${data.expectedTime}\nCurrent time: ${new Date().toLocaleTimeString()}`,
        status: 'sent',
        sent_at: now,
      });
      break;

    case 'hours_approved':
      notifications.push({
        user_id: apprenticeship.student_id,
        type: 'hours_approved',
        title: '✅ Your Hours Have Been Approved',
        body: `Hi ${apprenticeship.student.full_name},\n\nYour ${data.hours} hours for ${data.date} have been approved!\n\nTotal hours: ${apprenticeship.total_hours_completed}/${apprenticeship.total_hours_required}\nProgress: ${((apprenticeship.total_hours_completed / apprenticeship.total_hours_required) * 100).toFixed(1)}%`,
        status: 'sent',
        sent_at: now,
      });
      break;

    case 'payroll_ready':
      notifications.push({
        user_id: apprenticeship.student_id,
        type: 'payroll_ready',
        title: '💰 Payroll Ready - ' + data.periodEnd,
        body: `Hi ${apprenticeship.student.full_name},\n\nYour payroll is ready:\n\nPeriod: ${data.periodStart} to ${data.periodEnd}\nHours: ${data.hours}\nRate: $${apprenticeship.wage_current}/hr\nGross Pay: $${data.grossPay}`,
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
    await supabase.from('notification_logs').insert(notif);
  }

  return NextResponse.json({ success: true, sent: notifications.length });
}

// Cron endpoint to check for missed check-ins
async function _GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];
  const currentHour = new Date().getHours();

  // Only check during work hours (8 AM - 6 PM)
  if (currentHour < 8 || currentHour > 18) {
    return NextResponse.json({ message: 'Outside work hours' });
  }

  // Find apprentices who haven't checked in today
  const { data: apprenticeships } = await supabase
    .from('apprenticeship_enrollments')
    .select(`
      *,
      student:profiles!apprenticeship_enrollments_student_id_fkey(email, full_name)
    `)
    .eq('status', 'active');

  let alertsSent = 0;

  for (const apprenticeship of apprenticeships || []) {
    const { data: todayLog } = await supabase
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
export const GET = withApiAudit('/api/apprentice/email-alerts', _GET);
export const POST = withApiAudit('/api/apprentice/email-alerts', _POST);
