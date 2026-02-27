import { hashLicenseKey, isValidLicenseKeyFormat } from '@/lib/store/license';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { checkRateLimit } from '@/lib/rate-limit';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    // Rate limiting for validation attempts
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    const rateLimit = await checkRateLimit({
      key: `license-validate:${clientIp}`,
      limit: 20,
      windowSeconds: 60, // 20 requests per minute
    });

    if (!rateLimit.ok) {
      logger.warn('License validation rate limit exceeded', { ip: clientIp });
      return Response.json(
        { valid: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const { licenseKey, email, domain } = await req.json();

    if (!licenseKey) {
      return Response.json({ error: 'License key required' }, { status: 400 });
    }

    // Validate format - support both old and new formats
    const isNewFormat = licenseKey.startsWith('EFH-');
    const isOldFormat = isValidLicenseKeyFormat(licenseKey);
    
    if (!isNewFormat && !isOldFormat) {
      logger.warn('Invalid license key format attempted', { ip: clientIp });
      return Response.json(
        { valid: false, error: 'Invalid license key format' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }
    const licenseHash = hashLicenseKey(licenseKey);

    // Find license by hashed key
    const { data: license, error } = await supabase
      .from('licenses')
      .select('id, customer_email, domain, tier, status, features, max_deployments, max_users, expires_at, created_at')
      .eq('license_key', licenseHash)
      .single();

    if (error || !license) {
      logger.info('License validation failed - not found', { ip: clientIp });
      return Response.json(
        { valid: false, error: 'License not found' },
        { status: 404 }
      );
    }

    // Check license status
    if (license.status !== 'active') {
      logger.info('License validation failed - inactive', { 
        licenseId: license.id, 
        status: license.status 
      });
      return Response.json({
        valid: false,
        error: `License is ${license.status}`,
        status: license.status,
      });
    }

    // Check expiration
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      logger.info('License validation failed - expired', { licenseId: license.id });
      return Response.json({
        valid: false,
        error: 'License has expired',
        expiredAt: license.expires_at,
      });
    }

    // Optional: verify email matches
    if (email && license.customer_email !== email) {
      logger.warn('License validation - email mismatch', { 
        licenseId: license.id,
        ip: clientIp 
      });
      return Response.json(
        { valid: false, error: 'Email does not match license' },
        { status: 403 }
      );
    }

    // Log successful validation
    await supabase.from('license_validations').insert({
      license_id: license.id,
      ip_address: clientIp,
      user_agent: req.headers.get('user-agent') || 'unknown',
      result: 'valid',
      metadata: { domain: domain || null },
    });

    logger.info('License validated successfully', { licenseId: license.id });

    return Response.json({
      valid: true,
      license: {
        id: license.id,
        tier: license.tier,
        features: license.features,
        maxDeployments: license.max_deployments,
        maxUsers: license.max_users,
        expiresAt: license.expires_at,
      },
    });
  } catch (error) { 
    logger.error(
      'License validation error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return Response.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/store/license/validate', _POST);
