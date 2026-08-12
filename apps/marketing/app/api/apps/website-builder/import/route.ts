import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { createClient } from '@/lib/supabase/server';
import { requireFeatureForAuth } from '@/lib/platform/require-feature-for-auth';
import { FEATURES } from '@/lib/platform/feature-catalog';
import { importExistingWebsite } from '@/lib/websites/import-site-service';
import { getWebsiteBuilderAccess } from '@/lib/apps/website-builder-access';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function hasIndividualWebsiteImport(userId: string) {
  const supabase = await createClient();
  const access = await getWebsiteBuilderAccess(userId, supabase);
  if (!access.allowed) return false;
  if (access.isAdmin) return true;
  return ['professional', 'enterprise'].includes(access.plan || '');
}

function canonicalTenantHref(labelValue: unknown, hrefValue: unknown, sourceOrigin: string) {
  const label = typeof labelValue === 'string' ? labelValue.trim() : '';
  const href = typeof hrefValue === 'string' ? hrefValue.trim() : '';
  if (!label || !href) return null;

  const semantic = `${label} ${href}`.toLowerCase();
  if (/\b(home|welcome)\b/.test(semantic)) return { label, href: '/' };
  if (/\b(about|our story|who we are)\b/.test(semantic)) return { label, href: '/about' };
  if (/\b(contact|connect|reach us)\b/.test(semantic)) return { label, href: '/contact' };
  if (/\b(shop|store|product|merch)\b/.test(semantic)) return { label, href: '/shop' };
  if (/\b(program|service|course|training|offering)\b/.test(semantic)) return { label, href: '/programs' };

  try {
    const parsed = new URL(href, sourceOrigin);
    // Preserve genuinely external destinations (social links, partner portals,
    // booking providers). Same-origin unknown paths are omitted because the
    // tenant renderer cannot safely claim a page it did not migrate.
    if (parsed.origin !== sourceOrigin) return { label, href: parsed.href };
  } catch {
    // Invalid imported links are dropped rather than published broken.
  }
  return null;
}

function normalizeImportedConfig(imported: any, sourceUrl: string) {
  let sourceOrigin = '';
  try {
    sourceOrigin = new URL(sourceUrl).origin;
  } catch {
    return imported;
  }

  const navigation = Array.isArray(imported?.config?.navigation)
    ? imported.config.navigation
        .map((item: any) => canonicalTenantHref(item?.label, item?.href, sourceOrigin))
        .filter(Boolean)
        .filter((item: any, index: number, all: any[]) =>
          index === all.findIndex((candidate) => candidate.href === item.href || candidate.label === item.label),
        )
        .slice(0, 12)
    : [];

  const required = [
    { label: 'Home', href: '/' },
    { label: imported?.config?.meta?.siteKind === 'store' ? 'Shop' : 'Programs', href: imported?.config?.meta?.siteKind === 'store' ? '/shop' : '/programs' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];
  for (const item of required) {
    if (!navigation.some((candidate: any) => candidate.href === item.href)) navigation.push(item);
  }

  return {
    ...imported,
    config: {
      ...(imported.config || {}),
      navigation,
    },
  };
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
          error: 'Website import is available on Website Builder Professional/Enterprise or with the Website Import entitlement.',
          upgradeUrl: '/store/apps/website-builder',
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

    const imported = normalizeImportedConfig(await importExistingWebsite(url, includePages), url);
    return NextResponse.json({ success: true, ...imported });
  } catch (error) {
    logger.warn('[website-builder-import] import failed', { error: String(error) });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import website' },
      { status: 400 },
    );
  }
}

export const POST = withApiAudit('/api/apps/website-builder/import', _POST);
