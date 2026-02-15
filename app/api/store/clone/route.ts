import { cloneRepoForCustomer } from '@/lib/store/github-clone';
import { hashLicenseKey } from '@/lib/store/license';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { checkRateLimit } from '@/lib/rate-limit';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    // Rate limiting for clone operations
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    const rateLimit = await checkRateLimit({
      key: `license-clone:${clientIp}`,
      limit: 3,
      windowSeconds: 3600, // 3 clones per hour
    });

    if (!rateLimit.ok) {
      logger.warn('Clone rate limit exceeded', { ip: clientIp });
      return Response.json(
        { error: 'Too many clone requests. Please try again later.' },
        { status: 429 }
      );
    }

    const { licenseKey, targetOwner, targetRepo } = await req.json();

    if (!licenseKey || !targetOwner || !targetRepo) {
      return Response.json(
        { error: 'License key, target owner, and target repo required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Validate license using hashed key lookup
    const licenseHash = hashLicenseKey(licenseKey);
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .select('id, tier, status, features, max_deployments, expires_at, metadata')
      .eq('license_key', licenseHash)
      .single();

    if (licenseError || !license) {
      logger.warn('Clone attempt with invalid license', { ip: clientIp });
      return Response.json({ error: 'Invalid license key' }, { status: 403 });
    }

    // Check license status
    if (license.status !== 'active') {
      return Response.json(
        { error: `License is ${license.status}` },
        { status: 403 }
      );
    }

    // Check expiration
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return Response.json(
        { error: 'License has expired' },
        { status: 403 }
      );
    }

    // Get product repo from metadata
    const productSlug = license.metadata?.product_slug;
    if (!productSlug) {
      return Response.json(
        { error: 'License has no associated product' },
        { status: 400 }
      );
    }

    // Map product slug to repository
    const productRepos: Record<string, string> = {
      'starter-license': 'elevateforhumanity/elevate-starter',
      'school-license': 'elevateforhumanity/elevate-school',
      'agency-license': 'elevateforhumanity/elevate-agency',
      'enterprise-license': 'elevateforhumanity/elevate-enterprise',
    };

    const sourceRepo = productRepos[productSlug];
    if (!sourceRepo) {
      return Response.json(
        { error: 'Product has no repository configured' },
        { status: 400 }
      );
    }

    // Clone repository
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      return Response.json(
        { error: 'GitHub token not configured' },
        { status: 500 }
      );
    }

    const result = await cloneRepoForCustomer({
      sourceRepo,
      targetOwner,
      targetRepo,
      githubToken,
    });

    if (!result.success) {
      logger.error('Clone failed', new Error(result.error || 'Unknown error'), { licenseId: license.id });
      return Response.json({ error: result.error }, { status: 500 });
    }

    // Log successful clone
    logger.info('Repository cloned successfully', {
      licenseId: license.id,
      sourceRepo,
      targetRepo: `${targetOwner}/${targetRepo}`,
    });

    return Response.json({
      success: true,
      repoUrl: result.repoUrl,
      cloneUrl: result.cloneUrl,
    });
  } catch (error) { /* Error handled silently */ 
    logger.error(
      'Clone error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return Response.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
