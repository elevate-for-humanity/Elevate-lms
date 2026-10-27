import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { createClient } from '@/lib/supabase/server';
import { getWebsiteBuilderAccess } from '@/lib/apps/website-builder-access';
import { importStructuredWebsiteData } from '@/lib/websites/import-data-service';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  if (!auth.userId || auth.userId === 'service-role') {
    return NextResponse.json({ error: 'User authentication required' }, { status: 401 });
  }

  const supabase = await createClient();
  const access = await getWebsiteBuilderAccess(auth.userId, supabase);
  if (!access.allowed) {
    return NextResponse.json(
      {
        error: 'Website Builder subscription or active trial required',
        reason: access.reason,
        upgradeUrl: access.upgradeUrl,
      },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const content = typeof body.content === 'string' ? body.content : '';
    const fileName = typeof body.fileName === 'string' ? body.fileName.slice(0, 240) : undefined;
    if (!content) return NextResponse.json({ error: 'Import data is required' }, { status: 400 });

    const imported = importStructuredWebsiteData({ content, fileName });
    return NextResponse.json({
      success: true,
      originalUrl: '',
      importType: 'data',
      extracted: {
        title: imported.siteName,
        description: `${imported.recordCount} ${imported.format.toUpperCase()} record${imported.recordCount === 1 ? '' : 's'} prepared for review.`,
        pageCount: imported.config.pages?.length || 0,
        imagesFound: 0,
        colorsDetected: Object.values(imported.config.template.colors || {}).slice(0, 12),
      },
      config: imported.config,
    });
  } catch (error) {
    logger.warn('[website-builder-import-data] import failed', { error: String(error) });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import website data' },
      { status: 400 },
    );
  }
}

export const POST = withApiAudit('/api/apps/website-builder/import-data', _POST);
