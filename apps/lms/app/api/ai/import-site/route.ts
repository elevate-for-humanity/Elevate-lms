import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { createClient } from '@/lib/supabase/server';
import { requireFeatureForAuth } from '@/lib/platform/require-feature-for-auth';
import { FEATURES } from '@/lib/platform/feature-catalog';
import { importExistingWebsite } from '@/lib/websites/import-site-service';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function hasIndividualWebsiteImport(userId: string) {
  const supabase = await createClient();
  const { data: appSub } = await supabase
    .from('user_app_subscriptions')
    .select('plan, status, trial_ends_at')
    .eq('user_id', userId)
    .eq('app_slug', 'website-builder')
    .maybeSingle();

  if (!appSub || !['trial', 'active'].includes(appSub.status || '')) return false;
  if (appSub.status === 'trial' && appSub.trial_ends_at && new Date(appSub.trial_ends_at).getTime() < Date.now()) return false;
  return ['professional', 'enterprise'].includes(appSub.plan || '');
}

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  if (!auth.userId || auth.userId === 'service-role') {
    return NextResponse.json({ error: 'User authentication required' }, { status: 401 });
  }

  if (!(await hasIndividualWebsiteImport(auth.userId))) {
    const organizationAccess = await requireFeatureForAuth(request, FEATURES.WEBSITE_IMPORT);
    if (organizationAccess instanceof NextResponse) {
      return NextResponse.json(
        {
          error: 'Website import requires Website Builder Professional/Enterprise or the Website Import add-on.',
          upgradeUrl: 'https://www.elevateforhumanity.org/store/apps/website-builder',
          feature: FEATURES.WEBSITE_IMPORT,
        },
        { status: 403 },
      );
    }
  }

  try {
    const body = await request.json();
    const url = typeof body.url === 'string' ? body.url.trim() : '';
    const includePages = Array.isArray(body.includePages)
      ? body.includePages.filter((value: unknown): value is string => typeof value === 'string').slice(0, 6)
      : undefined;

    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

    const imported = await importExistingWebsite(url, includePages);
    return NextResponse.json({
      success: true,
      ...imported,
      previewUrl: `/preview/${imported.previewId}`,
    });
  } catch (error) {
    logger.warn('[website-import] import failed', { error: String(error) });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import site' },
      { status: 400 },
    );
  }
}

export const POST = withApiAudit('/api/ai/import-site', _POST);
