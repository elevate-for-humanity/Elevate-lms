import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/sendgrid';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HOST_TYPES = ['host_shop', 'barber', 'training_site', 'cosmetology_school', 'salon'];
const PLACEHOLDER = /(^qa-|@qa\.invalid$|pending-contact\+)/i;
const APP_URL = 'https://app.elevateforhumanity.org';

function safe(value: unknown) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] || char);
}

async function audience(db: any) {
  const [{ data: apprentices, error: apprenticeError }, { data: partners, error: partnerError }] = await Promise.all([
    db.from('apprentices').select('user_id,status').eq('status', 'active'),
    db.from('partners').select('id,name,shop_name,contact_email,status,approval_status,is_active,partner_type')
      .eq('status', 'active').eq('approval_status', 'approved').eq('is_active', true).in('partner_type', HOST_TYPES),
  ]);
  if (apprenticeError) throw apprenticeError;
  if (partnerError) throw partnerError;

  const apprenticeIds = (apprentices ?? []).map((row: any) => row.user_id).filter(Boolean);
  const partnerIds = (partners ?? []).map((row: any) => row.id).filter(Boolean);

  const { data: partnerUsers, error: partnerUsersError } = partnerIds.length
    ? await db.from('partner_users').select('partner_id,user_id,status').in('partner_id', partnerIds)
    : { data: [], error: null };
  if (partnerUsersError) throw partnerUsersError;

  const activePartnerUsers = (partnerUsers ?? []).filter((row: any) =>
    ['active', 'approved'].includes(String(row.status || '').toLowerCase()),
  );
  const profileIds = [...new Set([...apprenticeIds, ...activePartnerUsers.map((row: any) => row.user_id).filter(Boolean)])];

  const { data: profiles, error: profilesError } = profileIds.length
    ? await db.from('profiles').select('id,full_name,email').in('id', profileIds)
    : { data: [], error: null };
  if (profilesError) throw profilesError;

  const profileById = new Map((profiles ?? []).map((profile: any) => [profile.id, profile]));
  const apprenticeRecipients = (apprentices ?? []).map((row: any) => {
    const profile: any = profileById.get(row.user_id);
    return {
      kind: 'apprentice' as const,
      userId: row.user_id,
      name: profile?.full_name || 'Apprentice',
      email: String(profile?.email || '').trim().toLowerCase(),
    };
  }).filter((row: any) => row.email && !PLACEHOLDER.test(row.email));

  const hostRecipients = (partners ?? []).flatMap((partner: any) => {
    const members = activePartnerUsers
      .filter((member: any) => member.partner_id === partner.id)
      .map((member: any) => ({ userId: member.user_id, profile: profileById.get(member.user_id) }))
      .filter((member: any) => member.profile?.email);
    const candidates = members.length
      ? members.map((member: any) => ({ userId: member.userId, email: member.profile.email }))
      : [{ userId: null, email: partner.contact_email }];
    return candidates.map((candidate: any) => ({
      kind: 'host_shop' as const,
      userId: candidate.userId,
      partnerId: partner.id,
      name: partner.shop_name || partner.name || 'Host Shop',
      email: String(candidate.email || '').trim().toLowerCase(),
    }));
  }).filter((row: any) => row.email && !PLACEHOLDER.test(row.email));

  const seen = new Set<string>();
  return [...apprenticeRecipients, ...hostRecipients].filter((row) => {
    if (seen.has(row.email)) return false;
    seen.add(row.email);
    return true;
  });
}

async function _GET(req: NextRequest) {
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  const db = await requireAdminClient();
  const recipients = await audience(db);
  return NextResponse.json({
    recipients: recipients.map(({ email, name, kind }) => ({ email, name, kind })),
    total: recipients.length,
  });
}

async function _POST(req: NextRequest) {
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  const db = await requireAdminClient();
  const recipients = await audience(db);
  const now = new Date().toISOString();
  const results: Array<{ email: string; ok: boolean; error?: string }> = [];

  for (const recipient of recipients) {
    const emailType = 'portal-readiness-2026-09-11:' + recipient.email;
    const { data: prior } = await db.from('email_delivery_logs').select('id,status')
      .eq('email_type', emailType).eq('status', 'sent').limit(1).maybeSingle();
    if (prior) {
      results.push({ email: recipient.email, ok: true });
      continue;
    }

    const isApprentice = recipient.kind === 'apprentice';
    const subject = isApprentice
      ? 'Your apprentice portal is open — complete required documents'
      : 'Your Host Shop portal is ready — complete required documents';
    const loginUrl = APP_URL + (isApprentice ? '/login' : '/host-shop/login');
    const documentUrl = APP_URL + (isApprentice ? '/apprentice/documents' : '/host-shop/dashboard/documents');
    const heading = isApprentice ? 'Your apprentice portal is open now.' : 'Your production Host Shop portal is ready.';
    const body = isApprentice
      ? 'Sign in now and complete every required document. Theory coursework opens September 11, 2026.'
      : 'Sign in now and complete every required onboarding, agreement, and compliance document shown in your readiness checklist.';
    const html = '<!doctype html><html><body style="font-family:Arial,sans-serif;color:#0f172a"><div style="max-width:620px;margin:auto;padding:24px"><h2>' +
      safe(heading) + '</h2><p>Hello ' + safe(recipient.name) + ',</p><p>' + safe(body) +
      '</p><p><a href="' + loginUrl + '">Sign in to your portal</a></p><p><a href="' + documentUrl +
      '">Complete required documents</a></p><p style="color:#64748b;font-size:13px">Elevate for Humanity</p></div></body></html>';

    const sent = await sendEmail({
      to: recipient.email,
      subject,
      html,
      text: heading + '\n\n' + body + '\n\nSign in: ' + loginUrl + '\nDocuments: ' + documentUrl,
    });
    await db.from('email_delivery_logs').insert({
      user_id: recipient.userId ?? null,
      email_type: emailType,
      status: sent.success ? 'sent' : 'failed',
      sent_at: sent.success ? now : null,
      error_message: sent.success ? null : sent.error,
    });
    results.push({ email: recipient.email, ok: sent.success, error: sent.success ? undefined : sent.error });
  }

  return NextResponse.json({
    ok: results.every((row) => row.ok),
    sent: results.filter((row) => row.ok).length,
    failed: results.filter((row) => !row.ok).length,
    results,
  });
}

export const GET = withApiAudit('/api/admin/portal-readiness-email', _GET);
export const POST = withApiAudit('/api/admin/portal-readiness-email', _POST);
