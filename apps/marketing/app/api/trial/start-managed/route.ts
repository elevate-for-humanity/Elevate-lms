// PUBLIC ROUTE: managed trial start form
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { resend } from '@/lib/resend';
import { hydrateProcessEnv } from '@/lib/secrets';
import { strictRateLimit } from '@/lib/rate-limit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { logger } from '@/lib/logger';

const TRIAL_DAYS = 14;
const fallbackLimiter = new Map<string, { count: number; reset: number }>();

function emailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'organization';
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
  publicPreviewUrl: string;
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
      <p><a href="${params.loginUrl}" style="display:inline-block;padding:12px 20px;background:#dc2626;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">Sign in to your workspace</a></p>
      <p>Public preview: <a href="${params.publicPreviewUrl}">${params.publicPreviewUrl}</a></p>
      <p>Trial ends: ${new Date(params.trialEndsAt).toLocaleDateString('en-US')}</p>
      <p>This sign-in link is intended for the email address used to create the trial. If it expires, use the normal platform login to request a new link.</p>
      <p>Reference: ${params.reference}</p>
    `,
  });
}

async function _POST(request: NextRequest) {
  await hydrateProcessEnv();
  const reference = `trial_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const body = await request.json();
    const orgName = typeof body.orgName === 'string' ? body.orgName.trim() : '';
    const adminName = typeof body.adminName === 'string' ? body.adminName.trim() : '';
    const email = typeof body.adminEmail === 'string' ? body.adminEmail.trim().toLowerCase() : '';
    const websiteMode = body.websiteMode === 'existing' ? 'existing_site' : 'new_site';
    const existingUrl = typeof body.existingUrl === 'string' ? body.existingUrl.trim() : '';
    const programs = typeof body.programs === 'string' ? body.programs.trim() : '';

    if (orgName.length < 2 || orgName.length > 100 || adminName.length < 2 || !emailValid(email)) {
      return NextResponse.json({ error: 'Valid organization name, administrator name, and email are required.', correlationId: reference }, { status: 400 });
    }
    if (!(await allowed(email))) {
      return NextResponse.json({ error: 'Too many trial requests. Please try again later.', correlationId: reference }, { status: 429 });
    }

    const db = await getAdminClient();
    if (!db) return NextResponse.json({ error: 'Trial service is unavailable.', correlationId: reference }, { status: 503 });

    let { data: organization } = await db.from('organizations').select('id, name, slug, contact_email').eq('contact_email', email).maybeSingle();
    let createdOrganization = false;

    if (!organization) {
      let slug = slugify(orgName);
      const reserved = new Set(['www','app','api','admin','dashboard','mail','support','help','docs','demo']);
      if (reserved.has(slug)) slug = `${slug}-org`;
      const { data: sameSlug } = await db.from('organizations').select('id').eq('slug', slug).maybeSingle();
      if (sameSlug) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

      const created = await db.from('organizations').insert({
        name: orgName,
        slug,
        type: 'training_provider',
        status: 'active',
        contact_name: adminName,
        contact_email: email,
        domain: `${slug}.app.elevateforhumanity.org`,
        ...(existingUrl ? { website_url: existingUrl } : {}),
        ...(programs ? { notes: `Programs: ${programs}` } : {}),
      }).select('id, name, slug, contact_email').single();

      if (created.error || !created.data) {
        logger.error('[trial] organization creation failed', created.error as any, { reference });
        return NextResponse.json({ error: 'Failed to create organization.', correlationId: reference }, { status: 500 });
      }
      organization = created.data;
      createdOrganization = true;
    }

    const trialEnds = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { data: existingLicense } = await db.from('managed_licenses').select('id, trial_ends_at, status').eq('organization_id', organization.id).maybeSingle();
    let trialEndsAt = existingLicense?.trial_ends_at || trialEnds;

    if (!existingLicense) {
      const license = await db.from('managed_licenses').insert({
        organization_id: organization.id,
        status: 'active',
        tier: 'trial',
        plan_id: 'managed-trial',
        trial_started_at: new Date().toISOString(),
        trial_ends_at: trialEnds,
        expires_at: trialEnds,
      }).select('id').single();

      if (license.error) {
        if (createdOrganization) await db.from('organizations').delete().eq('id', organization.id);
        logger.error('[trial] license creation failed', license.error as any, { reference });
        return NextResponse.json({ error: 'Failed to create trial license.', correlationId: reference }, { status: 500 });
      }
    }

    const dashboardUrl = `https://${organization.slug}.app.elevateforhumanity.org/admin`;
    const publicPreviewUrl = `https://${organization.slug}.app.elevateforhumanity.org`;
    const fallbackLogin = `https://app.elevateforhumanity.org/login?redirect=${encodeURIComponent(dashboardUrl)}`;
    let loginUrl = fallbackLogin;

    // Generate a genuine one-time magic link. Passing metadata lets profile-sync
    // triggers preserve organization context on first sign-in where supported.
    try {
      const generated: any = await db.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: {
          redirectTo: dashboardUrl,
          data: { full_name: adminName, role: 'org_admin', organization_id: organization.id },
        },
      });
      const actionLink = generated?.data?.properties?.action_link;
      const authUser = generated?.data?.user;
      if (actionLink) loginUrl = actionLink;

      if (authUser?.id) {
        // Best effort only: deployments differ on optional profile columns.
        await db.from('profiles').upsert({
          id: authUser.id,
          email,
          full_name: adminName,
          role: 'org_admin',
          organization_id: organization.id,
        }, { onConflict: 'id' }).then(() => undefined, () => undefined);
      }
    } catch (authErr) {
      logger.warn('[trial] magic-link generation failed; using login page fallback', authErr as Error, { reference });
    }

    await db.from('license_events').insert({
      organization_id: organization.id,
      event_type: createdOrganization ? 'trial_self_service_start' : 'trial_self_service_reopen',
      event_data: { correlation_id: reference, admin_email: email, connection_mode: websiteMode, existing_url: existingUrl || null, programs: programs || null },
    }).then(() => undefined, () => undefined);

    try {
      await sendWelcome({ email, orgName: organization.name || orgName, loginUrl, publicPreviewUrl, trialEndsAt, reference });
    } catch (mailErr) {
      logger.warn('[trial] welcome email failed', mailErr as Error, { reference });
    }

    return NextResponse.json({
      ok: true,
      tenantUrl: dashboardUrl,
      publicPreviewUrl,
      subdomain: organization.slug,
      trialEndsAt,
      correlationId: reference,
      connectionMode: websiteMode,
      message: 'Trial workspace created.',
    });
  } catch (error) {
    logger.error('[trial] unexpected error', error as Error, { reference });
    return NextResponse.json({ error: 'Internal server error', correlationId: reference }, { status: 500 });
  }
}

export const POST = withRuntime(withApiAudit('/api/trial/start-managed', _POST));
