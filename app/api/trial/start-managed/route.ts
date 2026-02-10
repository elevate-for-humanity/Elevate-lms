import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const TRIAL_DURATION_DAYS = 14;

// Simple in-memory rate limit: max 3 trials per email per hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(email);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(email, { count: 1, resetAt: now + 60 * 60 * 1000 });
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
  dashboardUrl: string
) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn('[trial] RESEND_API_KEY not configured, skipping welcome email');
    return;
  }

  const resend = new Resend(resendKey);

  await resend.emails.send({
    from: 'Elevate LMS <noreply@elevateforhumanity.org>',
    to: email,
    subject: `Your 14-day trial is ready — ${orgName}`,
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
 * Returns: { ok, tenantUrl, subdomain, trialEndsAt }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgName, adminName, adminEmail } = body;

    // Validate required fields
    if (!orgName || !adminName || !adminEmail) {
      return NextResponse.json(
        { error: 'orgName, adminName, and adminEmail are required' },
        { status: 400 }
      );
    }

    if (typeof orgName !== 'string' || orgName.trim().length < 2 || orgName.trim().length > 100) {
      return NextResponse.json({ error: 'orgName must be 2-100 characters' }, { status: 400 });
    }

    if (typeof adminName !== 'string' || adminName.trim().length < 2) {
      return NextResponse.json({ error: 'adminName must be at least 2 characters' }, { status: 400 });
    }

    const email = adminEmail.trim().toLowerCase();
    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Rate limit
    if (!checkRateLimit(email)) {
      return NextResponse.json(
        { error: 'Too many trial requests. Please try again later.' },
        { status: 429 }
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    // Check if org with this email already exists
    const { data: existingOrg } = await supabase
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
    const { data: slugTaken } = await supabase
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
    const { data: org, error: orgError } = await supabase
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
      console.error('[trial] Org creation error:', orgError);
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
    }

    // Create trial license
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS);

    const { data: license, error: licenseError } = await supabase
      .from('licenses')
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
      console.error('[trial] License creation error:', licenseError);
      // Rollback org
      await supabase.from('organizations').delete().eq('id', org.id);
      return NextResponse.json({ error: 'Failed to create trial license' }, { status: 500 });
    }

    // Log provisioning event
    await supabase.from('license_events').insert({
      license_id: license.id,
      organization_id: org.id,
      event_type: 'trial_self_service_start',
      event_data: {
        plan_id: 'managed-trial',
        subdomain,
        admin_email: email,
        source: 'public_trial_form',
      },
    }).catch(() => {}); // Non-critical

    // Send welcome email
    const dashboardUrl = `https://${subdomain}.elevatelms.com/admin`;
    try {
      await sendTrialWelcomeEmail(email, orgName.trim(), subdomain, dashboardUrl);
    } catch (emailError) {
      console.error('[trial] Failed to send welcome email:', emailError);
      // Don't fail — trial is created
    }

    return NextResponse.json({
      ok: true,
      tenantUrl: dashboardUrl,
      subdomain,
      trialEndsAt: trialEndsAt.toISOString(),
      message: `Trial created. Check ${email} for login instructions.`,
    });
  } catch (error) {
    console.error('[trial] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
