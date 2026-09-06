import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { hydrateProcessEnv } from '@/lib/secrets';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { sendSMS } from '@/lib/notifications/sms';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type Candidate = {
  entityId: string;
  userId: string | null;
  role: 'learner' | 'apprentice' | 'host_shop' | 'program_holder';
  name: string;
  email: string | null;
  phone: string | null;
  action: string;
  portalUrl: string;
};

const APP_URL = 'https://app.elevateforhumanity.org';
async function loadCandidates(db: any): Promise<Candidate[]> {
  const result: Candidate[] = [];
  const { data: enrollments } = await db.from('program_enrollments')
    .select('id,user_id,student_id,program_slug,status,next_required_action,orientation_completed_at,documents_completed_at,agreement_signed')
    .in('status', ['active', 'enrolled', 'in_progress', 'pending']);
  const learnerIds = [...new Set((enrollments || []).map((row: any) => row.user_id || row.student_id).filter(Boolean))];
  const { data: learnerProfiles } = learnerIds.length
    ? await db.from('profiles').select('id,email,phone,full_name,role,onboarding_completed').in('id', learnerIds)
    : { data: [] };
  const learnerById = new Map((learnerProfiles || []).map((row: any) => [row.id, row]));
  for (const enrollment of enrollments || []) {
    const userId = enrollment.user_id || enrollment.student_id;
    const profile: any = learnerById.get(userId);
    if (!profile) continue;
    const incomplete = !profile.onboarding_completed || !enrollment.orientation_completed_at ||
      !enrollment.documents_completed_at || enrollment.agreement_signed !== true || Boolean(enrollment.next_required_action);
    if (!incomplete) continue;
    const apprentice = String(enrollment.program_slug || '').includes('apprenticeship') || profile.role === 'apprentice';
    result.push({
      entityId: enrollment.id,
      userId,
      role: apprentice ? 'apprentice' : 'learner',
      name: profile.full_name || (apprentice ? 'Apprentice' : 'Learner'),
      email: profile.email || null,
      phone: profile.phone || null,
      action: String(enrollment.next_required_action || (!enrollment.documents_completed_at ? 'submit required documents' : !enrollment.agreement_signed ? 'sign required agreements' : 'complete onboarding')).replaceAll('_', ' '),
      portalUrl: `${APP_URL}${apprentice ? '/apprentice' : '/lms/dashboard'}`,
    });
  }

  const { data: partners } = await db.from('partners')
    .select('id,shop_name,name,contact_email,contact_phone,phone,onboarding_completed,onboarding_step')
    .eq('status', 'active').eq('approval_status', 'approved').eq('is_active', true)
    .or('onboarding_completed.is.null,onboarding_completed.eq.false');
  const partnerIds = (partners || []).map((row: any) => row.id);
  const { data: memberships } = partnerIds.length
    ? await db.from('partner_users').select('partner_id,user_id,status').in('partner_id', partnerIds).in('status', ['active', 'approved'])
    : { data: [] };
  const partnerUserIds = [...new Set((memberships || []).map((row: any) => row.user_id).filter(Boolean))];
  const { data: partnerProfiles } = partnerUserIds.length
    ? await db.from('profiles').select('id,email,phone,full_name').in('id', partnerUserIds)
    : { data: [] };
  const partnerProfileById = new Map((partnerProfiles || []).map((row: any) => [row.id, row]));
  for (const partner of partners || []) {
    const membership = (memberships || []).find((row: any) => row.partner_id === partner.id);
    const profile: any = membership ? partnerProfileById.get(membership.user_id) : null;
    result.push({
      entityId: partner.id,
      userId: membership?.user_id || null,
      role: 'host_shop',
      name: partner.shop_name || partner.name || profile?.full_name || 'Host Shop',
      email: profile?.email || partner.contact_email || null,
      phone: profile?.phone || partner.contact_phone || partner.phone || null,
      action: String(partner.onboarding_step || 'complete host shop onboarding').replaceAll('_', ' '),
      portalUrl: `${APP_URL}/host-shop/dashboard`,
    });
  }

  const { data: holders } = await db.from('program_holders')
    .select('id,user_id,organization_name,contact_name,contact_email,contact_phone,mou_signed,mou_status,status,welcome_email_sent')
    .in('status', ['active', 'approved']);
  for (const holder of holders || []) {
    if (holder.welcome_email_sent === true) continue;
    result.push({
      entityId: holder.id,
      userId: holder.user_id || null,
      role: 'program_holder',
      name: holder.contact_name || holder.organization_name || 'Program Holder',
      email: holder.contact_email || null,
      phone: holder.contact_phone || null,
      action: holder.mou_signed ? 'complete required documents and acknowledgements' : 'sign the Program Holder agreement',
      portalUrl: `${APP_URL}/program-holder/dashboard`,
    });
  }
  return result;
}

async function _GET(req: NextRequest) {
  await hydrateProcessEnv();
  if (!process.env.CRON_SECRET || req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = await requireAdminClient();
  const candidates = await loadCandidates(db);
  const userIds = [...new Set(candidates.map((row) => row.userId).filter(Boolean))] as string[];
  const { data: preferences } = userIds.length
    ? await db.from('notification_preferences').select('user_id,email_deadlines,sms_reminders,sms_phone,opted_in_at').in('user_id', userIds)
    : { data: [] };
  const prefByUser = new Map((preferences || []).map((row: any) => [row.user_id, row]));
  const slot = new Date().toISOString().slice(0, 13);
  let emailQueued = 0;
  let smsQueued = 0;

  for (const candidate of candidates) {
    const pref: any = candidate.userId ? prefByUser.get(candidate.userId) : null;
    const templateData = { name: candidate.name, next_action: candidate.action, portal_url: candidate.portalUrl, role: candidate.role };
    if (candidate.email && pref?.email_deadlines !== false) {
      const dedupe = `portal-completion:${candidate.role}:email:${slot}`;
      const { data: prior } = await db.from('notification_outbox').select('id')
        .eq('entity_id', candidate.entityId).eq('entity_type', dedupe).limit(1).maybeSingle();
      if (!prior) {
        const { error } = await db.from('notification_outbox').insert({
          channel: 'email', to_email: candidate.email,
          template_key: 'portal_completion_reminder', template_data: templateData,
          status: 'queued', scheduled_for: new Date().toISOString(),
          entity_type: dedupe, entity_id: candidate.entityId,
        });
        if (!error) emailQueued++;
      }
    }
    const smsPhone = pref?.sms_phone || candidate.phone;
    if (smsPhone && pref?.sms_reminders === true && pref?.opted_in_at) {
      const dedupe = `portal-completion:${candidate.role}:sms:${slot}`;
      const { data: prior } = await db.from('notification_outbox').select('id')
        .eq('entity_id', candidate.entityId).eq('entity_type', dedupe).limit(1).maybeSingle();
      if (prior) continue;

      const { data: reservation, error: reserveError } = await db.from('notification_outbox').insert({
        channel: 'sms', to_phone: smsPhone,
        template_key: 'portal_completion_reminder', template_data: templateData,
        status: 'processing', scheduled_for: new Date().toISOString(), processed_at: new Date().toISOString(),
        entity_type: dedupe, entity_id: candidate.entityId,
      }).select('id').single();
      if (reserveError || !reservation) continue;

      const message = `Elevate reminder for ${candidate.name}: please ${candidate.action}. Continue securely at ${candidate.portalUrl}. Reply STOP to opt out.`;
      const smsResult = await sendSMS(smsPhone, message);
      await db.from('notification_outbox').update({
        status: smsResult.success ? 'sent' : 'failed', sent_at: smsResult.success ? new Date().toISOString() : null,
        attempts: 1, last_error: smsResult.success ? null : 'SMS provider rejected this reminder',
      }).eq('id', reservation.id);
      if (smsResult.success) smsQueued++;
    }
  }
  return NextResponse.json({ ok: true, incomplete: candidates.length, emailQueued, smsQueued });
}

export const GET = withApiAudit('/api/cron/portal-completion-reminders', _GET);
