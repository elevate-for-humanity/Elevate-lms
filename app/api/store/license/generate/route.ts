import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateLicenseKey, hashLicenseKey } from '@/lib/store/license';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { checkRateLimit } from '@/lib/rate-limit';
import { applyRateLimit } from '@/lib/api/withRateLimit';

import { auditMutation } from '@/lib/api/withAudit';

// Verify admin API key for internal/webhook calls
function verifyAdminApiKey(request: Request): boolean {
  const apiKey = request.headers.get('x-admin-api-key');
  const expectedKey = process.env.ADMIN_API_KEY;
  
  if (!expectedKey) {
    logger.warn('ADMIN_API_KEY not configured - admin API access disabled');
    return false;
  }
  
  return apiKey === expectedKey;
}

// Verify Stripe webhook signature for automated license generation
function isStripeWebhook(request: Request): boolean {
  return request.headers.has('stripe-signature');
}

// Determine tier and features from product
function getProductTier(productSlug: string): {
  tier: 'starter' | 'business' | 'enterprise';
  features: string[];
  maxDeployments: number;
  maxUsers: number;
  duration: number; // days
} {
  const tiers = {
    'starter-license': {
      tier: 'starter' as const,
      features: ['basic_lms', 'single_deployment', 'email_support'],
      maxDeployments: 1,
      maxUsers: 50,
      duration: 365,
    },
    'school-license': {
      tier: 'business' as const,
      features: [
        'complete_lms',
        'payment_integration',
        'white_label',
        'priority_support',
      ],
      maxDeployments: 3,
      maxUsers: 500,
      duration: 365,
    },
    'agency-license': {
      tier: 'business' as const,
      features: [
        'complete_lms',
        'payment_integration',
        'white_label',
        'api_access',
      ],
      maxDeployments: 5,
      maxUsers: 1000,
      duration: 365,
    },
    'enterprise-license': {
      tier: 'enterprise' as const,
      features: [
        'complete_lms',
        'payment_integration',
        'white_label',
        'api_access',
        'custom_development',
        'dedicated_support',
      ],
      maxDeployments: 999,
      maxUsers: 999999,
      duration: 365,
    },
  };

  return tiers[productSlug as keyof typeof tiers] || tiers['starter-license'];
}

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    // Rate limiting - strict limit for license generation
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    const rateLimit = await checkRateLimit({
      key: `license-generate:${clientIp}`,
      limit: 5,
      windowSeconds: 300, // 5 requests per 5 minutes
    });

    if (!rateLimit.ok) {
      logger.warn('License generation rate limit exceeded', { ip: clientIp });
      return Response.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Authentication: require either admin API key or authenticated admin user
    const isAdmin = verifyAdminApiKey(req);
    const isWebhook = isStripeWebhook(req);
    
    if (!isAdmin && !isWebhook) {
      // Check for authenticated admin user
      const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        logger.warn('Unauthorized license generation attempt', { ip: clientIp });
        return Response.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Verify admin role
      const { data: profile } = await db
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile?.role || !['admin', 'super_admin'].includes(profile.role)) {
        logger.warn('Non-admin license generation attempt', { 
          userId: user.id, 
          role: profile?.role 
        });
        return Response.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    const { email, productSlug, domain } = await req.json();

    if (!email || !productSlug) {
      return Response.json(
        { error: 'Email and productSlug required' },
        { status: 400 }
      );
    }

    // Use admin client for license operations
    const supabase = createAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }

    // Get product configuration
    const config = getProductTier(productSlug);

    // Generate license key and hash for storage
    const licenseKey = generateLicenseKey();
    const licenseKeyHash = hashLicenseKey(licenseKey);

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.duration);

    // Store license with hashed key (never store raw key)
    const { data: license, error: licenseError } = await db
      .from('licenses')
      .insert({
        license_key: licenseKeyHash,
        domain: domain || 'pending-setup',
        customer_email: email,
        tier: config.tier,
        status: 'active',
        features: config.features,
        max_deployments: config.maxDeployments,
        max_users: config.maxUsers,
        expires_at: expiresAt.toISOString(),
        metadata: {
          product_slug: productSlug,
          purchased_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (licenseError) {
      logger.error('Failed to store license:', licenseError);
      return Response.json(
        { error: 'Failed to generate license' },
        { status: 500 }
      );
    }

    // Audit log the license generation
    logger.info('License generated', {
      licenseId: license.id,
      email,
      productSlug,
      tier: config.tier,
      expiresAt: expiresAt.toISOString(),
      generatedBy: isWebhook ? 'stripe-webhook' : isAdmin ? 'admin-api' : 'admin-user',
    });

    return Response.json({
      success: true,
      licenseKey, // Only return once, should be emailed to customer
      licenseId: license.id,
      tier: config.tier,
      expiresAt: expiresAt.toISOString(),
      features: config.features,
    });
  } catch (error) { 
    logger.error(
      'License generation error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return Response.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
