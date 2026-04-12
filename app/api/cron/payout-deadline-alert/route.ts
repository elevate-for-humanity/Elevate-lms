/**
 * Cron: payout-deadline-alert
 *
 * Runs daily. Sends an internal alert to info@elevateforhumanity.org when
 * a partner payout deadline is within 2 days or already overdue.
 *
 * Schedule (netlify.toml): "0 9 * * *" — 9am UTC daily
 * Auth: CRON_SECRET bearer token
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getAdminClient();
  if (!db) return NextResponse.json({ error: 'Server error' }, { status: 500 });

  const now = new Date();
  const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  // Find payouts due within 2 days OR already overdue, not yet paid
  const { data: rawRows, error } = await db
    .from('program_enrollments')
    .select(`
      id, user_id, program_slug,
      voucher_paid_date, payout_due_date, payout_status,
      program_holders:partner_id ( name, contact_name, contact_email )
    `)
    .in('payout_status', ['pending', 'due', 'overdue'])
    .not('payout_due_date', 'is', null)
    .lte('payout_due_date', twoDaysFromNow.toISOString());

  if (error) {
    return NextResponse.json({ error: 'DB query failed' }, { status: 500 });
  }

  if (!rawRows || rawRows.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No upcoming payout deadlines' });
  }

  // Hydrate profiles separately (user_id → auth.users, no FK to profiles)
  const cronUserIds = [...new Set(rawRows.map((r: any) => r.user_id).filter(Boolean))];
  const { data: cronProfiles } = cronUserIds.length
    ? await db.from('profiles').select('id, full_name, email').in('id', cronUserIds)
    : { data: [] };
  const cronProfileMap = Object.fromEntries((cronProfiles ?? []).map((p: any) => [p.id, p]));
  const rows = rawRows.map((r: any) => ({ ...r, profiles: cronProfileMap[r.user_id] ?? null }));

  // Mark overdue in DB while we're here
  const overdueIds = rows
    .filter(r => r.payout_due_date && new Date(r.payout_due_date) < now)
    .map(r => r.id);

  if (overdueIds.length > 0) {
    await db
      .from('program_enrollments')
      .update({ payout_status: 'overdue' })
      .in('id', overdueIds)
      .neq('payout_status', 'paid');
  }

  // Build email table rows
  const tableRows = rows.map(row => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const partner = Array.isArray(row.program_holders) ? row.program_holders[0] : row.program_holders;
    const dueDate = row.payout_due_date ? new Date(row.payout_due_date) : null;
    const daysLeft = dueDate
      ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    const isOverdue = daysLeft !== null && daysLeft < 0;

    return `
      <tr style="border-bottom:1px solid #e2e8f0;${isOverdue ? 'background:#fff5f5;' : ''}">
        <td style="padding:10px;font-size:13px;">${profile?.full_name ?? '—'}</td>
        <td style="padding:10px;font-size:13px;">${partner?.name ?? '—'}</td>
        <td style="padding:10px;font-size:13px;">${row.program_slug?.replace(/-/g, ' ') ?? '—'}</td>
        <td style="padding:10px;font-size:13px;${isOverdue ? 'color:#dc2626;font-weight:bold;' : 'color:#d97706;font-weight:bold;'}">
          ${dueDate ? dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
        </td>
        <td style="padding:10px;font-size:13px;${isOverdue ? 'color:#dc2626;font-weight:bold;' : ''}">
          ${isOverdue ? `${Math.abs(daysLeft!)}d overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft}d`}
        </td>
        <td style="padding:10px;font-size:13px;font-weight:bold;">$2,500</td>
      </tr>
    `;
  }).join('');

  const overdueCount = rows.filter(r => r.payout_due_date && new Date(r.payout_due_date) < now).length;
  const totalOwed = rows.length * 2500;

  await sendEmail({
    to: 'info@elevateforhumanity.org',
    subject: `⚠️ ${rows.length} Partner Payout${rows.length > 1 ? 's' : ''} Due Within 2 Days — $${totalOwed.toLocaleString()} Owed`,
    html: `
<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:20px;">
  <div style="background:#1e293b;padding:20px;border-radius:8px 8px 0 0;">
    <h1 style="color:white;margin:0;font-size:18px;">Elevate for Humanity — Payout Alert</h1>
    <p style="color:#94a3b8;margin:4px 0 0;font-size:13px;">Daily payout deadline check · ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
  </div>
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
    ${overdueCount > 0 ? `
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px;margin-bottom:20px;">
      <p style="margin:0;color:#991b1b;font-weight:bold;font-size:14px;">⚠️ ${overdueCount} payout${overdueCount > 1 ? 's are' : ' is'} overdue</p>
      <p style="margin:6px 0 0;color:#b91c1c;font-size:13px;">These must be processed immediately to comply with the MOU payment terms.</p>
    </div>` : ''}
    <p style="color:#475569;font-size:14px;margin-bottom:16px;">
      The following partner payouts are due within 2 days or are overdue. Per MOU Section 4, payment must be rendered within <strong>10 business days</strong> of voucher receipt.
    </p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <tr style="background:#1e293b;color:white;">
        <th style="padding:10px;text-align:left;font-size:12px;">Student</th>
        <th style="padding:10px;text-align:left;font-size:12px;">Partner</th>
        <th style="padding:10px;text-align:left;font-size:12px;">Program</th>
        <th style="padding:10px;text-align:left;font-size:12px;">Due Date</th>
        <th style="padding:10px;text-align:left;font-size:12px;">Time Left</th>
        <th style="padding:10px;text-align:left;font-size:12px;">Amount</th>
      </tr>
      ${tableRows}
    </table>
    <div style="text-align:center;margin:24px 0;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/payout-queue" style="background:#dc2626;color:white;padding:12px 28px;border-radius:8px;font-weight:bold;font-size:14px;text-decoration:none;display:inline-block;">
        Open Payout Queue
      </a>
    </div>
    <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">This is an automated alert. Do not reply to this email.</p>
  </div>
</div>
    `,
  });

  return NextResponse.json({
    sent: 1,
    alerts: rows.length,
    overdue: overdueCount,
    total_owed: totalOwed,
  });
}
