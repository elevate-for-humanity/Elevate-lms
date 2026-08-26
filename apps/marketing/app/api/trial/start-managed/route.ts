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
import { ensureTrialOwnerAccess } from '@/lib/workspace/ensure-trial-owner-access';

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

// Password link is generated after provisioning so the one-time token is fresh.

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
      <div style="background:#ffffff;color:#0f172a;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:500;line-height:1.6;padding:24px">
        <h1 style="color:#0f172a;font-size:28px;font-weight:800;line-height:1.2">Your organization trial is ready.</h1>
        <p style="color:#0f172a"><strong>${params.orgName}</strong></p>
        <p style="color:#0f172a">Create your password now. After setup, you will go directly to the Website Builder and PARIS will begin the interview for your first draft.</p>
        <p><a href="${params.loginUrl}" style="display:inline-block;padding:14px 22px;background:#b91c1c;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:800">Create password and start PARIS interview</a></p>
        <p style="color:#334155">This is a one-time security link. If it expires, request a new password link from the login page.</p>
        <p style="color:#334155">Website Builder: ${params.builderUrl}</p>
        <p style="color:#334155">Trial ends: ${new Date(params.trialEndsAt).toLocaleDateString('en-US')}</p>
        <p style="color:#334155">Reference: ${params.reference}</p>
      </div>
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
    const recommendedCapabilities = Array.isArray(body.recommendedCapabilities)
      ? body.recommendedCapabilities.filter((value: unknown): value is string => typeof value === 'string').slice(0, 12)
      : [];

    if (organizationName.length < 2 || organizationName.length > 100 || ownerName.length < 2 || !emailValid(ownerEmail)) {
      return NextResponse.json({ error: 'Valid organization name, administrator name, and email are required.', correlationId: reference }, { status: 400 });
    }
    if (websiteMode === 'existing' && !existingUrl) {
      return NextResponse.json({ error: 'A valid existing website URL is required.', correlationId: reference }, { status: 400 });
    }
    if (!(await allowed(ownerEmail))) {
      return NextResponse.json({ error: 'Too many trial requests. Please try again later.', correlationId: reference }, { status: 429 });
    }

    const trial = await startWorkspaceTrial({ organizationName, ownerEmail, ownerName, industry, plan: 'builder' });
    if ('error' in trial) {
      return NextResponse.json({ error: trial.error, correlationId: reference }, { status: typeof trial.status === 'number' ? trial.status : 500 });
    }

    const db = await requireAdminClient();
    const builderUrl = websiteMode === 'existing' && existingUrl
      ? `/apps/website-builder/import?url=${encodeURIComponent(existingUrl)}`
      : '/apps/website-builder';

    const access = await ensureTrialOwnerAccess({
      organizationId: trial.organizationId,
      tenantId: trial.tenantId,
      workspaceId: trial.workspaceId,
      ownerEmail,
      ownerName,
      builderUrl,
      websiteMode,
      existingUrl,
      programs,
      reference,
      source: recommendedCapabilities.length ? 'guided_setup' : 'managed_trial',
      db,
    });

    if (access.ok === false) {
      return NextResponse.json({
        error: `Workspace exists but onboarding could not complete at ${access.stage}. ${access.error}`,
        correlationId: reference,
        onboardingStage: access.stage,
        retryable: true,
      }, { status: 500 });
    }

    const { data: workspace } = await db.from('customer_workspaces').select('metadata').eq('id', trial.workspaceId).maybeSingle();
    const metadata = workspace?.metadata && typeof workspace.metadata === 'object' ? workspace.metadata as Record<string, unknown> : {};
    await db.from('customer_workspaces').update({
      metadata: {
        ...metadata,
        guided_recommendations: recommendedCapabilities,
        onboarding_complete: true,
        customer_ready_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    }).eq('id', trial.workspaceId);

    await db.from('license_events').insert({
      organization_id: trial.organizationId,
      tenant_id: trial.tenantId,
      event_type: 'trial_workspace_created',
      correlation_id: reference,
      source: recommendedCapabilities.length ? 'guided_setup' : 'managed_trial',
      event_data: {
        correlation_id: reference,
        tenant_id: trial.tenantId,
        workspace_id: trial.workspaceId,
        owner_email: ownerEmail,
        website_mode: websiteMode,
        existing_url: existingUrl,
        programs: programs || null,
        builder_url: builderUrl,
        recommended_capabilities: recommendedCapabilities,
      },
    });

    try {
      await sendWelcome({ email: ownerEmail, orgName: organizationName, loginUrl: access.loginUrl, builderUrl: access.builderUrl, trialEndsAt: trial.trialEndsAt, reference });
    } catch (mailErr) {
      logger.warn('[trial] welcome email failed', { reference, error: mailErr instanceof Error ? mailErr.message : String(mailErr) });
    }

    return NextResponse.json({
      ok: true,
      tenantId: trial.tenantId,
      organizationId: trial.organizationId,
      workspaceId: trial.workspaceId,
      tenantUrl: access.builderUrl,
      dashboardUrl: access.builderUrl,
      builderUrl: access.builderUrl,
      publicPreviewUrl: trial.publicPreviewUrl,
      subdomain: trial.slug,
      trialEndsAt: trial.trialEndsAt,
      correlationId: reference,
      connectionMode: websiteMode,
      existingUrl,
      loginUrl: access.loginUrl,
      requiresAuthentication: true,
      requiresPasswordSetup: true,
      requiresParisInterview: websiteMode === 'new',
      onboardingComplete: true,
      recommendedCapabilities,
      message: websiteMode === 'new'
        ? 'Trial workspace and owner access are ready. Create your password, then PARIS will begin the website interview.'
        : 'Trial workspace and owner access are ready. Create your password, then import and rebuild your existing website.',
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
