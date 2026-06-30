import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resend } from '@/lib/resend';
import { hydrateProcessEnv } from '@/lib/secrets';
import { apiRequireAdmin } from '@/lib/admin/guards';

import { auditMutation } from '@/lib/api/withAudit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

import { withRuntime } from '@/lib/api/withRuntime';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

async function getSupabaseAdmin() {
  return await requireAdminClient();
}

async function sendWelcomeEmail(
  email: string,
  orgName: string,
  subdomain: string,
  dashboardUrl: string,
) {
  const sendgridKey = process.env.SENDGRID_API_KEY;
  if (!sendgridKey) {
    logger.warn('SENDGRID_API_KEY not configured, skipping welcome email');
    return;
  }

  await resend.emails.send({
    from: `${PLATFORM_DEFAULTS.orgName} <${PLATFORM_DEFAULTS.emailFromAddress}>`,
    to: email,
    subject: `Welcome to Elevate LMS - ${orgName} is ready!`,
    html: `
      <h1>Welcome to Elevate LMS!</h1>
      <p>Your organization <strong>${orgName}</strong> has been successfully provisioned.</p>
      <p><strong>Your Dashboard:</strong> <a href="${dashboardUrl}">${dashboardUrl}</a></p>
      <p><strong>Subdomain:</strong> ${subdomain}.app.elevateforhumanity.org</p>
      <h2>Next Steps:</h2>
      <ol>
        <li>Log in to your admin dashboard</li>
        <li>Configure your organization settings</li>
        <li>Add your first course or program</li>
        <li>Invite your team members</li>
      </ol>
      <p>Need help? Contact us at ${PLATFORM_DEFAULTS.supportEmail}</p>
    `,
  });
}

/**
 * POST /api/provisioning/tenant
 *
 * Provisions a new white-label tenant:
 * 1. Creates organization record
 * 2. Creates license record
 * 3. Sets up subdomain routing
 * 4. Sends welcome email
 */
async function _POST(request: NextRequest) {
  try {
    await hydrateProcessEnv();

    // Allow webhook secret bypass (automated provisioning) or admin session
    const webhookSecret = request.headers.get('x-webhook-secret');
    const isWebhook = webhookSecret === process.env.PROVISIONING_WEBHOOK_SECRET && !!webhookSecret;

    if (!isWebhook) {
      const auth = await apiRequireAdmin(request);
      if (auth.error) return auth.error;
    }

    const body = await request.json();
    const {
      organizationName,
      organizationType,
      contactName,
      contactEmail,
      contactPhone,
      planId,
      subdomain,
      customDomain,
      stripeCustomerId,
      stripeSubscriptionId,
    } = body;

    // Validate required fields
    if (!organizationName || !contactEmail || !planId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate subdomain if not provided
    const tenantSubdomain =
      subdomain ||
      organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .slice(0, 30);

    const supabase = await getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    // Check if subdomain is taken
    const { data: existing } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', tenantSubdomain)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Subdomain already taken' }, { status: 409 });
    }

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: organizationName,
        slug: tenantSubdomain,
        type: organizationType || 'training_provider',
        status: 'active',
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        domain: customDomain || `${tenantSubdomain}.app.elevateforhumanity.org`,
      })
      .select()
      .maybeSingle();

    if (orgError) {
      logger.error('Org creation error:', orgError);
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
    }

    // Create license
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .insert({
        organization_id: org.id,
        status: stripeSubscriptionId ? 'active' : 'trial',
        plan_id: planId,
        trial_started_at: new Date().toISOString(),
        trial_ends_at: trialEndsAt.toISOString(),
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
      })
      .select()
      .maybeSingle();

    if (licenseError) {
      logger.error('License creation error:', licenseError);
      // Rollback org creation
      await supabase.from('organizations').delete().eq('id', org.id);
      return NextResponse.json({ error: 'Failed to create license' }, { status: 500 });
    }

    // Log provisioning event
    await supabase.from('license_events').insert({
      license_id: license.id,
      organization_id: org.id,
      event_type: 'tenant_provisioned',
      event_data: {
        plan_id: planId,
        subdomain: tenantSubdomain,
        custom_domain: customDomain,
      },
    });

    // Send welcome email
    try {
      await sendWelcomeEmail(
        contactEmail,
        organizationName,
        tenantSubdomain,
        `https://app.elevateforhumanity.org/admin?org=${tenantSubdomain}`,
      );
    } catch (emailError) {
      logger.error('Failed to send welcome email:', emailError);
      // Don't fail provisioning if email fails
    }

    // DNS setup for custom domain is handled by Route53/infrastructure
    // Custom domains are configured in Route53 or via the admin API

    return NextResponse.json({
      success: true,
      tenant: {
        id: org.id,
        name: org.name,
        subdomain: tenantSubdomain,
        domain: org.domain,
        dashboardUrl: `https://app.elevateforhumanity.org/admin?org=${tenantSubdomain}`,
      },
      license: {
        id: license.id,
        status: license.status,
        planId: license.plan_id,
        trialEndsAt: license.trial_ends_at,
      },
    });
  } catch (error) {
    logger.error('Provisioning error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/provisioning/tenant?subdomain=xxx
 *
 * Check if subdomain is available
 */
async function _GET(request: NextRequest) {
  const subdomain = request.nextUrl.searchParams.get('subdomain');

  if (!subdomain) {
    return NextResponse.json({ error: 'Subdomain required' }, { status: 400 });
  }

  const normalized = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');

  // Reserved subdomains
  const reserved = ['www', 'app', 'api', 'admin', 'dashboard', 'mail', 'support', 'help', 'docs'];
  if (reserved.includes(normalized)) {
    return NextResponse.json({ available: false, reason: 'Reserved' });
  }

  const supabase = await getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { data } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', normalized)
    .maybeSingle();

  return NextResponse.json({
    available: !data,
    subdomain: normalized,
    domain: `${normalized}.app.elevateforhumanity.org`,
  });
}
export const GET = withRuntime(withApiAudit('/api/provisioning/tenant', _GET));
export const POST = withRuntime(withApiAudit('/api/provisioning/tenant', _POST));
