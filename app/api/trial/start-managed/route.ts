// PUBLIC ROUTE: managed trial start form (legacy alias → canonical workspace trial)
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { resend } from '@/lib/resend';
import { hydrateProcessEnv } from '@/lib/secrets';
import { strictRateLimit } from '@/lib/rate-limit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { isValidEmail } from '@/lib/validate';
import { tenantAdminUrl } from '@/lib/tenant/public-site-url';
import { startWorkspaceTrial } from '@/lib/workspace/start-workspace-trial';

const rateLimitFallback = new Map<string, { count: number; resetAt: number }>();

async function checkTrialRateLimit(email: string): Promise<boolean> {
  const limiter = strictRateLimit.get();
  if (limiter) {
    const result = await limiter.limit(`trial:${email}`);
    return result.success;
  }

  const now = Date.now();
  const entry = rateLimitFallback.get(email);

  if (!entry || now > entry.resetAt) {
    rateLimitFallback.set(email, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }

  if (entry.count >= 3) {
    return false;
  }

  entry.count++;
  return true;
}

async function sendTrialWelcomeEmail(
  email: string,
  orgName: string,
  subdomain: string,
  dashboardUrl: string,
  publicSiteUrl: string,
  correlationId: string,
) {
  const sendgridKey = process.env.SENDGRID_API_KEY;
  if (!sendgridKey) {
    logger.warn(
      `[trial] ${correlationId} - SENDGRID_API_KEY not configured, skipping welcome email`,
    );
    return;
  }

  await resend.emails.send({
    from: `${PLATFORM_DEFAULTS.emailFromName} <${PLATFORM_DEFAULTS.emailFromAddress}>`,
    to: email,
    subject: `Your 14-day trial is ready - ${orgName}`,
    html: `
      <h1>Your trial is live.</h1>
      <p>Organization: <strong>${orgName}</strong></p>
      <p>Workspace: <strong>${subdomain}</strong></p>
      <p><a href="${dashboardUrl}" style="display:inline-block;padding:12px 24px;background:#dc2626;color:#fff;font-weight:bold;text-decoration:none;border-radius:6px;">Open Your Dashboard</a></p>
      <p>Your public site: <a href="${publicSiteUrl}">${publicSiteUrl}</a></p>
      <h2>What to do now:</h2>
      <ol>
        <li>Visit your public site and share it with your team</li>
        <li>Log in to the admin dashboard to add programs and courses</li>
        <li>Customize your site in Website Builder</li>
        <li>Invite instructors and test enrollment</li>
      </ol>
      <p>Your trial runs for 14 days with full platform access. No credit card required.</p>
      <p>Questions? Reply to this email or visit <a href="${PLATFORM_DEFAULTS.siteUrl}/contact">our contact page</a>.</p>
    `,
  });
}

/**
 * POST /api/trial/start-managed
 *
 * Legacy public trial form — delegates to startWorkspaceTrial (canonical path).
 * Prefer POST /api/onboarding/launch for AI intake flow.
 */
async function _POST(request: NextRequest) {
  await hydrateProcessEnv();

  const correlationId = `trial_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const body = await request.json();
    const { orgName, adminName, adminEmail, websiteMode, existingUrl, programs } = body;

    if (!orgName || !adminName || !adminEmail) {
      return NextResponse.json(
        { error: 'orgName, adminName, and adminEmail are required', correlationId },
        { status: 400 },
      );
    }

    if (typeof orgName !== 'string' || orgName.trim().length < 2 || orgName.trim().length > 100) {
      return NextResponse.json(
        { error: 'orgName must be 2-100 characters', correlationId },
        { status: 400 },
      );
    }

    if (typeof adminName !== 'string' || adminName.trim().length < 2) {
      return NextResponse.json(
        { error: 'adminName must be at least 2 characters', correlationId },
        { status: 400 },
      );
    }

    const email = adminEmail.trim().toLowerCase();
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address', correlationId }, { status: 400 });
    }

    const connectionMode: 'new_site' | 'existing_site' | 'api_embed' =
      websiteMode === 'existing' ? 'existing_site' : 'new_site';

    if (!(await checkTrialRateLimit(email))) {
      return NextResponse.json(
        { error: 'Too many trial requests. Please try again later.', correlationId },
        { status: 429 },
      );
    }

    const supabase = await getAdminClient();
    if (!supabase) {
      logger.error(`[trial] ${correlationId} - Supabase not configured`);
      return NextResponse.json({ error: 'Service unavailable', correlationId }, { status: 503 });
    }

    const trial = await startWorkspaceTrial({
      organizationName: orgName.trim(),
      ownerEmail: email,
      ownerName: adminName.trim(),
      industry:
        typeof programs === 'string' && programs.trim() ? programs.trim() : 'Training Provider',
      plan: 'builder',
    });

    if (!trial.ok) {
      if (trial.status === 409) {
        const { data: existingOrg } = await supabase
          .from('organizations')
          .select('slug')
          .eq('contact_email', email)
          .maybeSingle();

        const subdomain = existingOrg?.slug ?? 'workspace';
        return NextResponse.json(
          {
            error: trial.error,
            tenantUrl: tenantAdminUrl(subdomain, '/admin'),
            publicPreviewUrl: `https://${subdomain}.app.elevateforhumanity.org`,
            subdomain,
            correlationId,
          },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { error: trial.error, correlationId },
        { status: trial.status ?? 500 },
      );
    }

    if (existingUrl || programs) {
      await supabase
        .from('organizations')
        .update({
          ...(existingUrl ? { website_url: existingUrl } : {}),
          ...(programs ? { notes: `Programs: ${programs}` } : {}),
        })
        .eq('id', trial.organizationId)
        .then(() => {}, () => {});
    }

    const { data: license } = await supabase
      .from('managed_licenses')
      .select('id')
      .eq('organization_id', trial.organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (license?.id) {
      await supabase
        .from('license_events')
        .insert({
          license_id: license.id,
          organization_id: trial.organizationId,
          event_type: 'trial_self_service_start',
          event_data: {
            correlation_id: correlationId,
            plan_id: 'workspace-trial',
            subdomain: trial.slug,
            admin_email: email,
            source: 'public_trial_form',
            connection_mode: connectionMode,
            existing_url: existingUrl || null,
            programs: programs || null,
            canonical_path: 'startWorkspaceTrial',
          },
        })
        .then(() => {}, () => {});
    }

    try {
      await sendTrialWelcomeEmail(
        email,
        orgName.trim(),
        trial.slug,
        trial.dashboardUrl,
        trial.publicPreviewUrl,
        correlationId,
      );
    } catch (emailError) {
      logger.error(`[trial] ${correlationId} - Failed to send welcome email:`, emailError);
    }

    return NextResponse.json({
      ok: true,
      tenantUrl: trial.dashboardUrl,
      publicPreviewUrl: trial.publicPreviewUrl,
      websiteId: null,
      subdomain: trial.slug,
      trialEndsAt: trial.trialEndsAt,
      correlationId,
      connectionMode,
      workspaceId: trial.workspaceId,
      message: `Trial created. Check ${email} for login instructions.`,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : JSON.stringify(error);
    logger.error(
      `[trial] ${correlationId} - Unexpected error: ${errMsg}`,
      error instanceof Error ? error : new Error(errMsg),
    );
    return NextResponse.json({ error: 'Internal server error', correlationId }, { status: 500 });
  }
}

export const POST = withRuntime(withApiAudit('/api/trial/start-managed', _POST));
