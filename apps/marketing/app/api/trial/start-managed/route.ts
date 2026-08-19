// PUBLIC ROUTE: managed trial start form
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resend } from '@/lib/resend';
import { strictRateLimit } from '@/lib/rate-limit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { logger } from '@/lib/logger';
import { startWorkspaceTrial } from '@/lib/workspace/start-workspace-trial';
import { startAppTrial } from '@/lib/trial/start-app-trial';

const fallbackLimiter = new Map<string, { count: number; reset: number }>();

function emailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeExistingUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

async function allowed(email: string) {
  const limiter = strictRateLimit.get();
  if (limiter) return (await limiter.limit(`trial:${email}`)).success;
  const now = Date.now();
  const current = fallbackLimiter.get(email);
  if (!current || current.reset < now) {
    fallbackLimiter.set(email, { count: 1, reset: now + 60 * 60 * 1000 });
    return true;
  }
  if (current.count >= 3) return false;
  current.count += 1;
  return true;
}

async function sendWelcome(params: {
  email: string;
  orgName: string;
  loginUrl: string;
  builderUrl: string;
  trialEndsAt: string;
  reference: string;
}) {
  await resend.emails.send({
    from: `Elevate LMS <${PLATFORM_DEFAULTS.emailFromAddress}>`,
    to: params.email,
    subject: `Your 14-day Elevate platform trial — ${params.orgName}`,
    html: `
      <h1>Your organization trial is ready.</h1>
      <p><strong>${params.orgName}</strong></p>
      <p>Sign in first. PARIS will interview you and build your website from your answers.</p>
      <p><a href="${params.loginUrl}" style="display:inline-block;padding:12px 20px;background:#dc2626;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">Sign in and build with PARIS</a></p>
      <p>Website Builder: ${params.builderUrl}</p>
      <p>Trial ends: ${new Date(params.trialEndsAt).toLocaleDateString('en-US')}</p>
      <p>Reference: ${params.reference}</p>
    `,
  });
}

async function _POST(request: NextRequest) {
  const reference = `trial_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const body = await request.json().catch(() => ({}));
    const organizationName = typeof body.orgName === 'string' ? body.orgName.trim() : '';
    const ownerName = typeof body.adminName === 'string' ? body.adminName.trim() : '';
    const ownerEmail = typeof body.adminEmail === 'string' ? body.adminEmail.trim().toLowerCase() : '';
    const industry = typeof body.industry === 'string' && body.industry.trim() ? body.industry.trim() : 'Training Provider';
    const websiteMode = body.websiteMode === 'existing' ? 'existing' : 'new';
    const existingUrl = normalizeExistingUrl(body.existingUrl);
    const programs = typeof body.programs === 'string' ? body.programs.trim() : '';

    if (organizationName.length < 2 || organizationName.length > 100 || ownerName.length < 2 || !emailValid(ownerEmail)) {
      return NextResponse.json({ error: 'Valid organization name, administrator name, and email are required.', correlationId: reference }, { status: 400 });
    }
    if (websiteMode === 'existing' && !existingUrl) return NextResponse.json({ error: 'A valid existing website URL is required.', correlationId: reference }, { status: 400 });
    if (!(await allowed(ownerEmail))) return NextResponse.json({ error: 'Too many trial requests. Please try again later.', correlationId: reference }, { status: 429 });

    const trial = await startWorkspaceTrial({ organizationName, ownerEmail, ownerName, industry, plan: 'builder' });
    if ('error' in trial) return NextResponse.json({ error: trial.error, correlationId: reference }, { status: typeof trial.status === 'number' ? trial.status : 500 });

    const db = await requireAdminClient();
    const builderUrl = websiteMode === 'existing' && existingUrl
      ? `/apps/website-builder/import?url=${encodeURIComponent(existingUrl)}`
      : '/apps/website-builder';

    const generated = await db.auth.admin.generateLink({
      type: 'magiclink',
      email: ownerEmail,
      options: {
        redirectTo: builderUrl,
        data: { full_name: ownerName, role: 'org_admin', organization_id: trial.organizationId, tenant_id: trial.tenantId },
      },
    });

    if (generated.error || !generated.data?.user?.id) {
      logger.error('[trial] administrator auth link generation failed', generated.error ?? undefined, { reference, ownerEmail });
      return NextResponse.json({ error: 'Workspace was created but administrator sign-in could not be provisioned.', correlationId: reference }, { status: 500 });
    }

    const authUser = generated.data.user;
    const { data: existingProfile, error: profileLookupError } = await db.from('profiles').select('id, email, full_name, role, organization_id, tenant_id').eq('id', authUser.id).maybeSingle();
    if (profileLookupError) return NextResponse.json({ error: 'Workspace was created but the administrator profile could not be checked.', correlationId: reference }, { status: 500 });

    const profilePayload = existingProfile
      ? { id: authUser.id, email: ownerEmail, full_name: ownerName, role: existingProfile.role ?? 'org_admin', organization_id: existingProfile.organization_id ?? trial.organizationId, tenant_id: existingProfile.tenant_id ?? trial.tenantId }
      : { id: authUser.id, email: ownerEmail, full_name: ownerName, role: 'org_admin', organization_id: trial.organizationId, tenant_id: trial.tenantId };

    const { error: profileError } = await db.from('profiles').upsert(profilePayload, { onConflict: 'id' });
    if (profileError) return NextResponse.json({ error: 'Workspace was created but the administrator profile could not be linked.', correlationId: reference }, { status: 500 });

    const { error: orgMembershipError } = await db.from('organization_users').upsert({ organization_id: trial.organizationId, user_id: authUser.id, role: 'org_owner', status: 'active' }, { onConflict: 'organization_id,user_id' });
    if (orgMembershipError) return NextResponse.json({ error: 'Workspace was created but organization access could not be provisioned.', correlationId: reference }, { status: 500 });

    const { error: tenantMembershipError } = await db.from('tenant_memberships').upsert({ tenant_id: trial.tenantId, user_id: authUser.id, role: 'owner' }, { onConflict: 'tenant_id,user_id' });
    if (tenantMembershipError) return NextResponse.json({ error: 'Workspace was created but tenant access could not be provisioned.', correlationId: reference }, { status: 500 });

    const builderTrial = await startAppTrial(authUser.id, 'website-builder', db);
    if (builderTrial.status === 'error') return NextResponse.json({ error: 'Workspace was created but Website Builder access could not be provisioned.', correlationId: reference }, { status: 500 });

    // startWorkspaceTrial may create a placeholder tenant website before the auth
    // user exists. Bind that row to the real owner, keep it private, and mark it
    // as interview-pending so PARIS can replace it instead of creating duplicates.
    const { data: website } = await db.from('user_websites').select('id, site_config').eq('organization_id', trial.organizationId).maybeSingle();
    if (website?.id) {
      const currentConfig = website.site_config && typeof website.site_config === 'object' ? website.site_config as Record<string, any> : {};
      const currentMeta = currentConfig.meta && typeof currentConfig.meta === 'object' ? currentConfig.meta : {};
      const updatedConfig = {
        ...currentConfig,
        meta: {
          ...currentMeta,
          parisInterviewCompleted: false,
          connectionMode: websiteMode,
          sourceWebsiteUrl: existingUrl,
          programsIntake: programs || null,
          trialReference: reference,
        },
      };
      const { error: websiteUpdateError } = await db.from('user_websites').update({
        user_id: authUser.id,
        site_config: updatedConfig,
        is_published: false,
        status: 'draft',
        updated_at: new Date().toISOString(),
      }).eq('id', website.id);
      if (websiteUpdateError) {
        logger.error('[trial] trial website ownership binding failed', websiteUpdateError, { reference, websiteId: website.id, userId: authUser.id });
        return NextResponse.json({ error: 'Workspace was created but Website Builder ownership could not be linked.', correlationId: reference }, { status: 500 });
      }
    }

    await db.from('license_events').insert({
      organization_id: trial.organizationId,
      tenant_id: trial.tenantId,
      event_type: 'trial_workspace_created',
      correlation_id: reference,
      source: 'managed_trial',
      event_data: { correlation_id: reference, tenant_id: trial.tenantId, workspace_id: trial.workspaceId, owner_email: ownerEmail, website_mode: websiteMode, existing_url: existingUrl, programs: programs || null, builder_url: builderUrl },
    });

    const fallbackLogin = `https://app.elevateforhumanity.org/login?redirect=${encodeURIComponent(builderUrl)}`;
    const loginUrl = generated.data?.properties?.action_link ?? fallbackLogin;

    try {
      await sendWelcome({ email: ownerEmail, orgName: organizationName, loginUrl, builderUrl, trialEndsAt: trial.trialEndsAt, reference });
    } catch (mailErr) {
      logger.warn('[trial] welcome email failed', { reference, error: mailErr instanceof Error ? mailErr.message : String(mailErr) });
    }

    return NextResponse.json({
      ok: true,
      tenantId: trial.tenantId,
      organizationId: trial.organizationId,
      workspaceId: trial.workspaceId,
      tenantUrl: builderUrl,
      dashboardUrl: builderUrl,
      builderUrl,
      publicPreviewUrl: null,
      subdomain: trial.slug,
      trialEndsAt: trial.trialEndsAt,
      correlationId: reference,
      connectionMode: websiteMode,
      existingUrl,
      loginUrl,
      requiresAuthentication: true,
      requiresParisInterview: websiteMode === 'new',
      message: websiteMode === 'new'
        ? 'Trial workspace created. Sign in, then PARIS will interview you and build the first website draft.'
        : 'Trial workspace created. Sign in to import and rebuild your existing website.',
    });
  } catch (error) {
    logger.error('[trial] provisioning failed', error instanceof Error ? error : new Error(String(error)), { reference });
    return NextResponse.json({ error: 'Trial workspace could not be created.', correlationId: reference }, { status: 500 });
  }
}

const auditedPost = withApiAudit('/api/trial/start-managed', _POST);

export const POST = withRuntime(
  { secrets: ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] },
  async (request) => auditedPost(request),
);
