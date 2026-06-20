/**
 * GET  /api/admin/publish-website — status (Northflank services, revalidate path count)
 * POST /api/admin/publish-website — bust LMS cache + trigger Northflank builds
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { hydrateProcessEnv } from '@/lib/secrets';
import {
  getPublishWebsiteStatus,
  publishAndUpdateWebsite,
} from '@/lib/admin/publish-website';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  await hydrateProcessEnv().catch(() => {});

  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const status = await getPublishWebsiteStatus();

    let draftPrograms = 0;
    let draftTestimonials = 0;
    const db = await requireAdminClient();
    if (db) {
      const [programsRes, testimonialsRes] = await Promise.all([
        db
          .from('programs')
          .select('id', { count: 'exact', head: true })
          .eq('published', false)
          .neq('status', 'archived'),
        db
          .from('testimonials')
          .select('id', { count: 'exact', head: true })
          .eq('published', false),
      ]);
      draftPrograms = programsRes.count ?? 0;
      draftTestimonials = testimonialsRes.count ?? 0;
    }

    return NextResponse.json({
      ...status,
      content: {
        unpublishedPrograms: draftPrograms,
        unpublishedTestimonials: draftTestimonials,
      },
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to load publish status');
  }
}

export async function POST(request: NextRequest) {
  await hydrateProcessEnv().catch(() => {});

  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  let body: { revalidate?: boolean; deploy?: boolean; confirm?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (body.confirm !== 'PUBLISH') {
    return safeError('Confirmation required. Send { "confirm": "PUBLISH" }.', 400);
  }

  try {
    const result = await publishAndUpdateWebsite({
      revalidate: body.revalidate !== false,
      deploy: body.deploy !== false,
    });

    const db = await requireAdminClient();
    if (db) {
      db.from('audit_logs')
        .insert({
          actor_id: auth.id,
          action: 'publish_website',
          resource_type: 'platform',
          resource_id: 'production',
          metadata: {
            ok: result.ok,
            revalidate: result.revalidate.ok,
            deploy: result.deploy.map((d) => ({ service: d.service, status: d.status })),
          },
        })
        .then(() => {})
        .catch((err) => logger.warn('[publish-website] audit log failed', err));
    }

    logger.info('[publish-website] triggered by admin', {
      userId: auth.id,
      ok: result.ok,
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  } catch (err) {
    return safeInternalError(err, 'Publish failed');
  }
}
