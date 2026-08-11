import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/sendgrid';
import { logger } from '@/lib/logger';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const ADMIN_ROLES = new Set(['admin', 'super_admin', 'staff', 'org_admin']);
const PORTAL_BASE = 'https://www.elevateforhumanity.org';

type AuthUserSummary = { id: string; email?: string | null };

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts.shift() || fullName,
    lastName: parts.join(' ') || null,
  };
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function requireAdminActor() {
  const auth = await createClient();
  const db = await requireAdminClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) } as const;

  const { data: profile } = await db
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || !ADMIN_ROLES.has(String(profile.role || ''))) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) } as const;
  }
  return { db, user } as const;
}

async function findOrCreateUser(
  db: Awaited<ReturnType<typeof requireAdminClient>>,
  email: string,
  fullName: string,
) {
  const normalizedEmail = email.toLowerCase().trim();
  const { data: existingProfile } = await db
    .from('profiles')
    .select('id, role, program_holder_id')
    .eq('email', normalizedEmail)
    .maybeSingle();
  if (existingProfile?.id) {
    return {
      userId: String(existingProfile.id),
      isNewUser: false,
      existingRole: String(existingProfile.role || ''),
    };
  }

  const { data: listed } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const users = (listed?.users ?? []) as AuthUserSummary[];
  const existingAuthUser = users.find(
    (candidate) => candidate.email?.toLowerCase() === normalizedEmail,
  );
  if (existingAuthUser?.id) {
    return { userId: existingAuthUser.id, isNewUser: false, existingRole: '' };
  }

  const tempPassword = `${crypto.randomUUID().replace(/-/g, '')}Aa1!`;
  const { data, error } = await db.auth.admin.createUser({
    email: normalizedEmail,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: 'program_holder' },
  });
  if (error || !data.user?.id) {
    throw new Error(error?.message || 'Unable to create Program Holder account.');
  }
  return { userId: data.user.id, isNewUser: true, existingRole: '' };
}

async function secureAccessLink(
  db: Awaited<ReturnType<typeof requireAdminClient>>,
  email: string,
  isNewUser: boolean,
) {
  const redirectTo = `${PORTAL_BASE}/auth/callback?redirect=${encodeURIComponent('/program-holder/sign-mou')}`;
  const { data, error } = await db.auth.admin.generateLink({
    type: isNewUser ? 'recovery' : 'magiclink',
    email: email.toLowerCase().trim(),
    options: { redirectTo },
  });
  if (error) {
    logger.warn('[program-holder/approve] secure access link failed', { email, error: error.message });
    return null;
  }
  return data?.properties?.action_link || null;
}

async function auditEmail(
  db: Awaited<ReturnType<typeof requireAdminClient>>,
  params: { recipient: string; subject: string; applicationId: string; success: boolean; error?: string },
) {
  await db.from('email_logs').insert({
    action: 'program_holder_approval_notification',
    recipient_email: params.recipient,
    recipient: params.recipient,
    to: params.recipient,
    subject: params.subject,
    provider: 'sendgrid',
    status: params.success ? 'sent' : 'failed',
    error_message: params.error || null,
    error: params.error || null,
    sent_at: params.success ? new Date().toISOString() : null,
    details: { application_id: params.applicationId, application_type: 'program_holder', event: 'approved' },
    metadata: { application_id: params.applicationId, application_type: 'program_holder', event: 'approved' },
  }).then(({ error }) => {
    if (error) logger.warn('[program-holder/approve] email audit failed', { error: error.message });
  });
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdminActor();
    if ('error' in actor) return actor.error;
    const { db, user: adminUser } = actor;
    const { id } = await params;

    const { data: application, error: applicationError } = await db
      .from('program_holder_applications')
      .select('id, tenant_id, user_id, organization_name, contact_name, email, phone, status, data')
      .eq('id', id)
      .maybeSingle();

    if (applicationError) throw applicationError;
    if (!application) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    if (application.status === 'rejected') {
      return NextResponse.json({ error: 'Rejected applications must be reopened before approval.' }, { status: 409 });
    }

    const email = String(application.email || '').toLowerCase().trim();
    const contactName = String(application.contact_name || application.organization_name || 'Program Holder').trim();
    if (!email) return NextResponse.json({ error: 'Application has no email address.' }, { status: 400 });

    const identity = await findOrCreateUser(db, email, contactName);
    const { data: priorMou } = await db
      .from('license_agreement_acceptances')
      .select('accepted_at')
      .eq('user_id', identity.userId)
      .eq('agreement_type', 'program_holder_mou')
      .order('accepted_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    const { data: existingHolder } = await db
      .from('program_holders')
      .select('id, user_id, status, approved_at, mou_signed, mou_signed_at')
      .or(`user_id.eq.${identity.userId},contact_email.eq.${email}`)
      .limit(1)
      .maybeSingle();

    const now = new Date().toISOString();
    const alreadySigned = Boolean(existingHolder?.mou_signed || priorMou?.accepted_at);
    const holderPayload = {
      user_id: identity.userId,
      organization_name: application.organization_name,
      name: application.organization_name,
      contact_name: contactName,
      contact_email: email,
      contact_phone: application.phone || null,
      status: 'approved',
      approved_at: existingHolder?.approved_at || now,
      approved_by: adminUser.id,
      mou_signed: alreadySigned,
      mou_signed_at: existingHolder?.mou_signed_at || priorMou?.accepted_at || null,
      mou_status: alreadySigned ? 'signed' : 'pending_signature',
    };

    let holderId: string;
    if (existingHolder?.id) {
      holderId = String(existingHolder.id);
      const { error } = await db.from('program_holders').update(holderPayload).eq('id', holderId);
      if (error) throw error;
    } else {
      const { data, error } = await db
        .from('program_holders')
        .insert(holderPayload)
        .select('id')
        .single();
      if (error || !data?.id) throw error || new Error('Program Holder record was not created.');
      holderId = String(data.id);
    }

    const { firstName, lastName } = splitName(contactName);
    const privilegedRole = ['admin', 'super_admin', 'staff', 'org_admin'].includes(identity.existingRole);
    const { data: profile } = await db.from('profiles').select('id').eq('id', identity.userId).maybeSingle();
    if (profile?.id) {
      const { error } = await db
        .from('profiles')
        .update({
          program_holder_id: holderId,
          ...(privilegedRole ? {} : { role: 'program_holder' }),
        })
        .eq('id', identity.userId);
      if (error) throw error;
    } else {
      const { error } = await db.from('profiles').insert({
        id: identity.userId,
        email,
        full_name: contactName,
        first_name: firstName,
        last_name: lastName,
        phone: application.phone || null,
        role: 'program_holder',
        program_holder_id: holderId,
        tenant_id: application.tenant_id || null,
      });
      if (error) throw error;
    }

    const existingData = application.data && typeof application.data === 'object' && !Array.isArray(application.data)
      ? application.data
      : {};
    const { error: appUpdateError } = await db
      .from('program_holder_applications')
      .update({
        status: 'approved',
        user_id: identity.userId,
        data: {
          ...existingData,
          approved_at: now,
          approved_by: adminUser.id,
          program_holder_id: holderId,
        },
        updated_at: now,
      })
      .eq('id', id);
    if (appUpdateError) throw appUpdateError;

    const accessLink = await secureAccessLink(db, email, identity.isNewUser);
    const portalUrl = `${PORTAL_BASE}/program-holder/dashboard`;
    const nextUrl = alreadySigned ? portalUrl : `${PORTAL_BASE}/program-holder/sign-mou`;
    const subject = 'Program Holder Application Approved — Complete Your Onboarding | Elevate for Humanity';
    const result = await sendEmail({
      to: email,
      subject,
      html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#0f172a"><h2>Your Program Holder application is approved</h2><p>Hello ${escapeHtml(contactName)},</p><p><strong>${escapeHtml(application.organization_name)}</strong> has been approved to continue Program Holder onboarding with Elevate for Humanity.</p><p><strong>Username:</strong> ${escapeHtml(email)}</p><p>For security, Elevate does not email a plaintext password.</p><p><a href="${accessLink || nextUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">${identity.isNewUser ? 'Set Password & Continue Onboarding' : 'Secure Sign In & Continue Onboarding'}</a></p><h3>Next steps</h3><ol>${alreadySigned ? '' : '<li>Sign the required Program Holder MOU.</li>'}<li>Complete your organization verification requirements.</li><li>Elevate links only the programs you are authorized to manage.</li><li>Use the Program Holder portal for approved programs, students, documents, training-hour actions, and reporting.</li></ol><p>Portal: <a href="${portalUrl}">${portalUrl}</a></p><p>Questions? Call ${PLATFORM_DEFAULTS.supportPhone}.</p></div>`,
    });
    await auditEmail(db, {
      recipient: email,
      subject,
      applicationId: id,
      success: result.success === true,
      error: result.success ? undefined : result.error,
    });

    if (result.success) {
      await db.from('program_holders').update({ welcome_email_sent: true }).eq('id', holderId);
    } else {
      await db.from('staff_notifications').insert({
        type: 'program_holder_approval_email_failed',
        title: `Program Holder approved but onboarding email failed: ${application.organization_name}`,
        message: `Application ${id} was approved and account provisioned, but the onboarding email to ${email} failed: ${result.error || 'unknown error'}`,
        severity: 'error',
        metadata: { application_id: id, program_holder_id: holderId, email, error: result.error || null },
      });
    }

    return NextResponse.json({
      success: true,
      applicationId: id,
      programHolderId: holderId,
      userId: identity.userId,
      mouSigned: alreadySigned,
      emailStatus: result.success ? 'sent' : 'failed',
    });
  } catch (error) {
    logger.error('[admin/program-holder/approve] failed', error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to approve Program Holder application.' },
      { status: 500 },
    );
  }
}
