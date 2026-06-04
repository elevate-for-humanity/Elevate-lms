// PUBLIC ROUTE: managed trial start form
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { resend } from '@/lib/resend';
import { hydrateProcessEnv } from '@/lib/secrets';
import { strictRateLimit } from '@/lib/rate-limit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

import { withRuntime } from '@/lib/api/withRuntime';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { provisionTrialWebsite } from '@/lib/tenant/provision-trial-website';
import { tenantAdminUrl } from '@/lib/tenant/public-site-url';

const TRIAL_DURATION_DAYS = 14;

// In-memory fallback when Upstash Redis is not configured
const rateLimitFallback = new Map<string, { count: number; resetAt: number }>();

async function checkTrialRateLimit(email: string): Promise<boolean> {
  // Prefer Upstash Redis (persistent across serverless instances)
  const limiter = strictRateLimit.get();
  if (limiter) {
    const result = await limiter.limit(`trial:${email}`);
    return result.success;
  }

  // Fallback: in-memory (per-process only)
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

async function getSupabaseAdmin() {
  return await getAdminClient();
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
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
 * Public self-service endpoint. Creates a 14-day managed platform trial.
 * No auth required - rate-limited by email.
 *
 * Body: { orgName, adminName, adminEmail, websiteMode, existingUrl, programs }
 * Returns: { ok, tenantUrl, publicPreviewUrl, websiteId, subdomain, trialEndsAt, correlationId }
 */
async function _POST(request: NextRequest) {
  await hydrateProcessEnv();

  // Correlation ID for tracing failures across client/server.
  const correlationId = `trial_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const body = await request.json();
    const { orgName, adminName, adminEmail, websiteMode, existingUrl, programs } = body;

    // Validate required fields
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
    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address', correlationId }, { status: 400 });
    }

    const connectionMode: 'new_site' | 'existing_site' | 'api_embed' =
      websiteMode === 'existing' ? 'existing_site' : 'new_site';

    // Rate limit (Upstash Redis if available, in-memory fallback)
    if (!(await checkTrialRateLimit(email))) {
      return NextResponse.json(
        { error: 'Too many trial requests. Please try again later.', correlationId },
        { status: 429 },
      );
    }

    const supabase = await getSupabaseAdmin();
    if (!supabase) {
      logger.error(`[trial] ${correlationId} - Supabase not configured`);
      return NextResponse.json({ error: 'Service unavailable', correlationId }, { status: 503 });
    }

    // Check if org with this email already exists
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id, slug')
      .eq('contact_email', email)
      .maybeSingle();

    if (existingOrg) {
      const tenantUrl = tenantAdminUrl(existingOrg.slug, '/admin');
      return NextResponse.json(
        {
          error: 'A trial already exists for this email address',
          tenantUrl,
          publicPreviewUrl: `https://${existingOrg.slug}.app.elevateforhumanity.org`,
          subdomain: existingOrg.slug,
        },
        { status: 409 },
      );
    }

    // Generate subdomain
    let subdomain = slugify(orgName.trim());
    const { data: slugTaken } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', subdomain)
      .maybeSingle();

    if (slugTaken) {
      subdomain = `${subdomain}-${Date.now().toString(36).slice(-4)}`;
    }

    // Reserved subdomains
    const reserved = [
      'www',
      'app',
      'api',
      'admin',
      'dashboard',
      'mail',
      'support',
      'help',
      'docs',
      'demo',
    ];
    if (reserved.includes(subdomain)) {
      subdomain = `${subdomain}-org`;
    }

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: orgName.trim(),
        slug: subdomain,
        type: 'training_provider',
        status: 'active',
        contact_name: adminName.trim(),
        contact_email: email,
        domain: `${subdomain}.app.elevateforhumanity.org`,
      })
      .select()
      .maybeSingle();

    if (orgError || !org) {
      const detail = orgError
        ? (orgError as { message?: string }).message ?? JSON.stringify(orgError)
        : 'insert returned no row (RLS or trigger blocked read-back)';
      logger.error(`[trial] ${correlationId} - Org creation error: ${detail}`, orgError instanceof Error ? orgError : new Error(detail));
      return NextResponse.json(
        { error: 'Failed to create organization', correlationId },
        { status: 500 },
      );
    }

    // Create trial license (managed_licenses table, separate from white-label licenses)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS);

    const { data: license, error: licenseError } = await supabase
      .from('managed_licenses')
      .insert({
        organization_id: org.id,
        status: 'active',
        tier: 'trial',
        plan_id: 'managed-trial',
        trial_started_at: new Date().toISOString(),
        trial_ends_at: trialEndsAt.toISOString(),
        expires_at: trialEndsAt.toISOString(),
      })
      .select()
      .maybeSingle();

    if (licenseError || !license) {
      const detail = licenseError
        ? (licenseError as { message?: string }).message ?? JSON.stringify(licenseError)
        : 'insert returned no row (RLS or trigger blocked read-back)';
      logger.error(`[trial] ${correlationId} - License creation error: ${detail}`, licenseError instanceof Error ? licenseError : new Error(detail));
      // Rollback org
      await supabase.from('organizations').delete().eq('id', org.id);
      return NextResponse.json(
        { error: 'Failed to create trial license', correlationId },
        { status: 500 },
      );
    }

    const website = await provisionTrialWebsite({
      organizationId: org.id,
      organizationName: orgName.trim(),
      subdomain,
      trialEndsAt: trialEndsAt.toISOString(),
      contactEmail: email,
      industry: typeof programs === 'string' && programs.trim() ? programs.trim() : 'Training Provider',
      websiteMode: connectionMode,
    });

    if (!website.ok) {
      logger.error(
        `[trial] ${correlationId} - Website provisioning error: ${website.error}`,
        new Error(website.error),
      );
      await supabase.from('managed_licenses').delete().eq('id', license.id).then(() => {}, () => {});
      await supabase.from('organizations').delete().eq('id', org.id).then(() => {}, () => {});
      return NextResponse.json(
        { error: 'Failed to provision trial website', correlationId },
        { status: 500 },
      );
    }

    // Log provisioning event
    await supabase
      .from('license_events')
      .insert({
        license_id: license.id,
        organization_id: org.id,
        event_type: 'trial_self_service_start',
        event_data: {
          correlation_id: correlationId,
          plan_id: 'managed-trial',
          subdomain,
          admin_email: email,
          source: 'public_trial_form',
          connection_mode: connectionMode,
          existing_url: existingUrl || null,
          programs: programs || null,
          website_id: website.websiteId,
          public_preview_url: website.publicUrl,
        },
      })
      .then(() => {}, () => {}); // Non-critical

    // Store extra intake fields on the org record if columns exist (best-effort)
    if (existingUrl || programs) {
      await supabase
        .from('organizations')
        .update({
          ...(existingUrl ? { website_url: existingUrl } : {}),
          ...(programs ? { notes: `Programs: ${programs}` } : {}),
        })
        .eq('id', org.id)
        .then(() => {}, () => {});
    }

    const dashboardUrl = tenantAdminUrl(subdomain, '/admin');
    const publicPreviewUrl = website.publicUrl;

    // Send welcome email
    try {
      await sendTrialWelcomeEmail(email, orgName.trim(), subdomain, dashboardUrl, publicPreviewUrl, correlationId);
    } catch (emailError) {
      logger.error(`[trial] ${correlationId} - Failed to send welcome email:`, emailError);
      // Don't fail - trial is created
    }

    return NextResponse.json({
      ok: true,
      tenantUrl: dashboardUrl,
      publicPreviewUrl,
      websiteId: website.websiteId,
      subdomain,
      trialEndsAt: trialEndsAt.toISOString(),
      correlationId,
      connectionMode,
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
