import { isUnpublishedOperationalProgram } from '@/lib/admin/dashboard/record-evidence';
/**
 * GET  /api/admin/publish-website — deployment/content status
 * POST /api/admin/publish-website — revalidate and deploy website services
 * Canonical owner: apps/admin. No cross-domain proxying.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireRoles } from '@/lib/admin/guards';
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

  const auth = await apiRequireRoles(request, ['admin', 'super_admin']);
  if (auth.error) return auth.error;

  try {
    const status = await getPublishWebsiteStatus();
    const db = await requireAdminClient();

    let draftPrograms: number | null = null;
    let draftTestimonials: number | null = null;

    if (db) {
      const [programsRes, testimonialsRes] = await Promise.all([
        (async () => {
          let count = 0;
          const signal = AbortSignal.timeout(8000);
          for (let offset = 0; ; offset += 500) {
            const { data, error } = await db.from('programs')
              .select('id,title,slug,published,status,archived_at')
              .order('id', { ascending: true })
              .range(offset, offset + 499)
              .abortSignal(signal);
            if (error) return { count: null, error };
            count += (data ?? []).filter(isUnpublishedOperationalProgram).length;
            if (!data || data.length < 500) return { count, error: null };
          }
        })(),
        db
          .from('testimonials')
          .select('id', { count: 'exact', head: true })
          .eq('published', false),
      ]);
      draftPrograms = programsRes.error ? null : programsRes.count;
      draftTestimonials = testimonialsRes.error ? null : (testimonialsRes.count ?? null);
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

  const auth = await apiRequireRoles(request, ['admin', 'super_admin']);
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
      void db
        .from('audit_logs')
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
        .then(({ error }) => {
          if (error) logger.warn('[publish-website] audit log failed', error);
        });
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
