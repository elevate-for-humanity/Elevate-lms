import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const paymentIntent = request.nextUrl.searchParams.get('payment_intent');

    if (!paymentIntent) {
      return NextResponse.json(
        { error: 'Payment intent ID required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Get the license purchase by payment intent
    const { data: purchase, error: purchaseError } = await db
      .from('license_purchases')
      .select(`
        id,
        product_id,
        product_slug,
        license_type,
        organization_name,
        contact_email,
        status,
        tenant_id,
        created_at
      `)
      .eq('stripe_payment_intent_id', paymentIntent)
      .single();

    if (purchaseError || !purchase) {
      logger.warn('License purchase not found', { paymentIntent });
      return NextResponse.json(
        { error: 'License not found' },
        { status: 404 }
      );
    }

    // Get the associated license if provisioned
    let license = null;
    if (purchase.tenant_id) {
      const { data: licenseData } = await db
        .from('licenses')
        .select('id, tier, status, features, max_users, max_programs, valid_until')
        .eq('tenant_id', purchase.tenant_id)
        .eq('status', 'active')
        .single();
      license = licenseData;
    }

    // Determine tier and features based on license type
    const tierConfig = getTierConfig(purchase.license_type);

    return NextResponse.json({
      purchaseId: purchase.id,
      productSlug: purchase.product_slug,
      organizationName: purchase.organization_name,
      email: purchase.contact_email,
      status: purchase.status,
      tier: license?.tier || tierConfig.tier,
      features: license?.features || tierConfig.features,
      maxDeployments: tierConfig.maxDeployments,
      maxUsers: license?.max_users || tierConfig.maxUsers,
      expiresAt: license?.valid_until || getExpirationDate(),
      repoUrl: getRepoUrl(purchase.license_type),
      // Note: We don't return the actual license key here for security
      // It's sent via email only
      licenseKey: '••••••••-••••-••••-••••-••••••••••••', // Masked
    });
  } catch (error) {
    logger.error('Failed to fetch license by payment', error as Error);
    return NextResponse.json(
      { error: 'Failed to fetch license details' },
      { status: 500 }
    );
  }
}

function getTierConfig(licenseType: string) {
  const configs: Record<string, any> = {
    single: {
      tier: 'starter',
      features: ['lms', 'enrollment', 'admin', 'mobile-app'],
      maxDeployments: 1,
      maxUsers: 100,
    },
    school: {
      tier: 'professional',
      features: ['lms', 'enrollment', 'admin', 'payments', 'partner-dashboard', 'case-management', 'compliance', 'white-label'],
      maxDeployments: 3,
      maxUsers: 1000,
    },
    enterprise: {
      tier: 'enterprise',
      features: ['lms', 'enrollment', 'admin', 'payments', 'partner-dashboard', 'case-management', 'employer-portal', 'compliance', 'white-label', 'ai-tutor', 'api-access'],
      maxDeployments: 999,
      maxUsers: 999999,
    },
  };

  return configs[licenseType] || configs.single;
}

function getExpirationDate(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString();
}

function getRepoUrl(licenseType: string): string {
  const repos: Record<string, string> = {
    single: 'https://github.com/elevateforhumanity/elevate-starter',
    school: 'https://github.com/elevateforhumanity/elevate-professional',
    enterprise: 'https://github.com/elevateforhumanity/elevate-enterprise',
  };
  return repos[licenseType] || repos.single;
}
