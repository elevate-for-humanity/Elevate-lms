import { logger } from '@/lib/logger';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { strictRateLimit } from '@/lib/rate-limit';
import { applyRateLimit } from '@/lib/api/withRateLimit';

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

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
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
  correlationId: string
) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    logger.warn(`[trial] ${correlationId} — RESEND_API_KEY not configured, skipping welcome email`);
    return;
  }

  const resend = new Resend(resendKey);

  await resend.emails.send({
    from: 'Elevate LMS <noreply@elevateforhumanity.org>',
    to: email,
    subject: `Your 14-day trial is ready — ${orgName}`,
    headers: { 'X-Correlation-ID': correlationId },
    html: `
      <h1>Your trial is live.</h1>
      <p>Organization: <strong>${orgName}</strong></p>
      <p>Dashboard: <a href="${dashboardUrl}">${dashboardUrl}</a></p>
      <p>Subdomain: ${subdomain}.elevatelms.com</p>
      <h2>What to do now:</h2>
      <ol>
        <li>Log in at the link above</li>
        <li>Configure your organization settings</li>
        <li>Add your first course or program</li>
        <li>Invite your team</li>
      </ol>
      <p>Your trial runs for 14 days with full platform access. No credit card required.</p>
      <p>Questions? Reply to this email or visit <a href="https://www.elevateforhumanity.org/contact">our contact page</a>.</p>
    `,
  });
}

/**
 * POST /api/trial/start-managed
 *
 * Public self-service endpoint. Creates a 14-day managed platform trial.
 * No auth required — rate-limited by email.
 *
 * Body: { orgName, adminName, adminEmail }
 * Returns: { ok, tenantUrl, subdomain, trialEndsAt, correlationId }
 */
export async function POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  // Correlation ID for tracing failures across client ↔ server
  const correlationId = `trial_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const body = await request.json();
    const { orgName, adminName, adminEmail } = body;

    // Validate required fields
    if (!orgName || !adminName || !adminEmail) {
      return NextResponse.json(
        { error: 'orgName, adminName, and adminEmail are required', correlationId },
        { status: 400 }
      );
    }

    if (typeof orgName !== 'string' || orgName.trim().length < 2 || orgName.trim().length > 100) {
      return NextResponse.json({ error: 'orgName must be 2-100 characters', correlationId }, { status: 400 });
    }

    if (typeof adminName !== 'string' || adminName.trim().length < 2) {
      return NextResponse.json({ error: 'adminName must be at least 2 characters', correlationId }, { status: 400 });
    }

    const email = adminEmail.trim().toLowerCase();
    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address', correlationId }, { status: 400 });
    }

    // Rate limit (Upstash Redis if available, in-memory fallback)
    if (!(await checkTrialRateLimit(email))) {
      return NextResponse.json(
        { error: 'Too many trial requests. Please try again later.', correlationId },
        { status: 429 }
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      logger.error(`[trial] ${correlationId} — Supabase not configured`);
      return NextResponse.json({ error: 'Service unavailable', correlationId }, { status: 503 });
    }

    // Check if org with this email already exists
    const { data: existingOrg } = await db
      .from('organizations')
      .select('id, slug')
      .eq('contact_email', email)
      .maybeSingle();

    if (existingOrg) {
      return NextResponse.json(
        {
          error: 'A trial already exists for this email address',
          tenantUrl: `https://${existingOrg.slug}.elevatelms.com/admin`,
          subdomain: existingOrg.slug,
        },
        { status: 409 }
      );
    }

    // Generate subdomain
    let subdomain = slugify(orgName.trim());
    const { data: slugTaken } = await db
      .from('organizations')
      .select('id')
      .eq('slug', subdomain)
      .maybeSingle();

    if (slugTaken) {
      subdomain = `${subdomain}-${Date.now().toString(36).slice(-4)}`;
    }

    // Reserved subdomains
    const reserved = ['www', 'app', 'api', 'admin', 'dashboard', 'mail', 'support', 'help', 'docs', 'demo'];
    if (reserved.includes(subdomain)) {
      subdomain = `${subdomain}-org`;
    }

    // Create organization
    const { data: org, error: orgError } = await db
      .from('organizations')
      .insert({
        name: orgName.trim(),
        slug: subdomain,
        type: 'training_provider',
        status: 'active',
        contact_name: adminName.trim(),
        contact_email: email,
        domain: `${subdomain}.elevatelms.com`,
      })
      .select()
      .single();

    if (orgError) {
      logger.error(`[trial] ${correlationId} — Org creation error:`, orgError);
      return NextResponse.json({ error: 'Failed to create organization', correlationId }, { status: 500 });
    }

    // Create trial license (managed_licenses table, separate from white-label licenses)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS);

    const { data: license, error: licenseError } = await db
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
      .single();

    if (licenseError) {
      logger.error(`[trial] ${correlationId} — License creation error:`, licenseError);
      // Rollback org
      await db.from('organizations').delete().eq('id', org.id);
      return NextResponse.json({ error: 'Failed to create trial license', correlationId }, { status: 500 });
    }

    // Log provisioning event
    await db.from('license_events').insert({
      license_id: license.id,
      organization_id: org.id,
      event_type: 'trial_self_service_start',
      event_data: {
        correlation_id: correlationId,
        plan_id: 'managed-trial',
        subdomain,
        admin_email: email,
        source: 'public_trial_form',
      },
    }).catch(() => {}); // Non-critical

    // Send welcome email
    const dashboardUrl = `https://${subdomain}.elevatelms.com/admin`;
    try {
      await sendTrialWelcomeEmail(email, orgName.trim(), subdomain, dashboardUrl, correlationId);
    } catch (emailError) {
      logger.error(`[trial] ${correlationId} — Failed to send welcome email:`, emailError);
      // Don't fail — trial is created
    }

    return NextResponse.json({
      ok: true,
      tenantUrl: dashboardUrl,
      subdomain,
      trialEndsAt: trialEndsAt.toISOString(),
      correlationId,
      message: `Trial created. Check ${email} for login instructions.`,
    });
  } catch (error) {
    logger.error(`[trial] ${correlationId} — Unexpected error:`, error);
    return NextResponse.json({ error: 'Internal server error', correlationId }, { status: 500 });
  }
}
