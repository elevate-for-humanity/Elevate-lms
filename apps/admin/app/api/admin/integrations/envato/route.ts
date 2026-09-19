import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/with-auth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { toErrorMessage } from '@/lib/safe';
import { hydrateProcessEnv } from '@/lib/secrets';
import { requireAdminClient } from '@/lib/supabase/admin';
import {
  recommendLicensedMediaForCourse,
  syncLicensedPurchases,
  type LicensedPurchase,
} from '@/lib/course-builder/licensed-media';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ENVATO_API = 'https://api.envato.com';
const MAX_RESULTS = 100;

function safeText(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function normalizePurchase(value: unknown): LicensedPurchase {
  const row = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const item =
    row.item && typeof row.item === 'object' ? (row.item as Record<string, unknown>) : {};
  return {
    itemId: String(item.id ?? ''),
    title: safeText(item.name) || safeText(item.title) || 'Purchased item',
    url: safeText(item.url),
    thumbnail: safeText(item.thumbnail_url) || safeText(item.previews),
    site: safeText(item.site),
    purchaseCode: safeText(row.code) || safeText(row.purchase_code),
    purchasedAt: safeText(row.sold_at) || safeText(row.purchase_date),
    supportedUntil: safeText(row.supported_until),
  };
}

async function envatoGet(path: string, params?: URLSearchParams) {
  await hydrateProcessEnv();
  const token = process.env.ENVATO_API_TOKEN?.trim();
  if (!token)
    throw Object.assign(new Error('ENVATO_API_TOKEN is not configured in Studio Secrets'), {
      status: 503,
    });
  const url = new URL(path, ENVATO_API);
  params?.forEach((value, key) => url.searchParams.set(key, value));
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'User-Agent': 'Elevate Course Builder/2.0',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  });
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const retryAfter = response.headers.get('retry-after');
    const detail = String(
      payload.error_description ?? payload.error ?? `Envato returned HTTP ${response.status}`,
    );
    throw Object.assign(
      new Error(
        response.status === 429 && retryAfter
          ? `${detail}. Try again in ${retryAfter} seconds.`
          : detail,
      ),
      { status: response.status },
    );
  }
  return payload;
}

async function listPurchases() {
  const payload = await envatoGet(
    '/v3/market/buyer/list-purchases',
    new URLSearchParams({
      page: '1',
      page_size: String(MAX_RESULTS),
    }),
  );
  const rows = Array.isArray(payload.results) ? payload.results : [];
  return rows.map(normalizePurchase).filter((purchase) => purchase.itemId);
}

async function courseOrg(db: Awaited<ReturnType<typeof requireAdminClient>>, courseId: string) {
  const { data, error } = await db
    .from('courses')
    .select('id,org_id')
    .eq('id', courseId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw Object.assign(new Error('Course not found'), { status: 404 });
  return data.org_id as string | null;
}

function errorResponse(error: unknown) {
  const status =
    typeof error === 'object' && error && 'status' in error
      ? Number((error as { status?: unknown }).status) || 502
      : 502;
  return NextResponse.json({ connected: false, error: toErrorMessage(error) }, { status });
}

const _GET = withAuth(
  async (request: NextRequest) => {
  const limited = await applyRateLimit(request, 'api');
    if (limited) return limited;
    try {
      const action = request.nextUrl.searchParams.get('action') || 'status';
      const courseId = request.nextUrl.searchParams.get('courseId')?.trim() || '';
      if (action === 'status') {
        const payload = await envatoGet('/v1/market/private/user/username.json');
        return NextResponse.json({
          connected: true,
          username: safeText(payload.username),
          provider: 'Envato Market',
        });
      }
      if (action === 'purchases') {
        const purchases = await listPurchases();
        return NextResponse.json({ connected: true, purchases, count: purchases.length });
      }
      if (action === 'recommendations') {
        if (!courseId) return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
        const db = await requireAdminClient();
        await courseOrg(db, courseId);
        const recommendations = await recommendLicensedMediaForCourse({ db, courseId });
        return NextResponse.json({ connected: true, recommendations });
      }
      if (action === 'download') {
        const itemId = request.nextUrl.searchParams.get('itemId')?.trim() || '';
        const purchaseCode = request.nextUrl.searchParams.get('purchaseCode')?.trim() || '';
        if (!itemId && !purchaseCode)
          return NextResponse.json(
            { error: 'itemId or purchaseCode is required' },
            { status: 400 },
          );
        const payload = await envatoGet(
          '/v3/market/buyer/download',
          new URLSearchParams(itemId ? { item_id: itemId } : { purchase_code: purchaseCode }),
        );
        const downloadUrl = safeText(payload.download_url);
        if (!downloadUrl.startsWith('https://'))
          return NextResponse.json(
            { error: 'Envato did not return a secure download URL' },
            { status: 502 },
          );
        return NextResponse.json({ downloadUrl });
      }
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
    } catch (error) {
      return errorResponse(error);
    }
  },
  { roles: ['admin'] },
);

const _POST = withAuth(
  async (request: NextRequest, user) => {
    const limited = await applyRateLimit(request, 'strict');
    if (limited) return limited;
    try {
      const input = (await request.json()) as {
        action?: string;
        courseId?: string;
        matchId?: string;
      };
      const db = await requireAdminClient();
      if (input.action === 'sync') {
        if (!input.courseId)
          return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
        const orgId = await courseOrg(db, input.courseId);
        const purchases = await listPurchases();
        const entitlements = await syncLicensedPurchases({
          db,
          purchases,
          actorId: user.id,
          orgId,
        });
        const recommendations = await recommendLicensedMediaForCourse({
          db,
          courseId: input.courseId,
        });
        return NextResponse.json({
          ok: true,
          purchases,
          entitlements: entitlements.length,
          recommendations,
        });
      }
      if (input.action === 'recommend') {
        if (!input.courseId)
          return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
        await courseOrg(db, input.courseId);
        const recommendations = await recommendLicensedMediaForCourse({
          db,
          courseId: input.courseId,
        });
        return NextResponse.json({ ok: true, recommendations });
      }
      if (input.action === 'approve' || input.action === 'reject') {
        if (!input.matchId)
          return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
        const update =
          input.action === 'approve'
            ? {
                status: 'approved',
                approved_by: user.id,
                approved_at: new Date().toISOString(),
                failure_reason: null,
              }
            : { status: 'rejected', approved_by: null, approved_at: null };
        const { data, error } = await db
          .from('course_lesson_media_matches')
          .update(update)
          .eq('id', input.matchId)
          .in('status', ['suggested', 'approved', 'rejected'])
          .select('id,status,lesson_id')
          .single();
        if (error) throw error;
        return NextResponse.json({ ok: true, match: data });
      }
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
    } catch (error) {
      return errorResponse(error);
    }
  },
  { roles: ['admin'] },
);

export const GET = withApiAudit('/api/admin/integrations/envato', _GET);
export const POST = withApiAudit('/api/admin/integrations/envato', _POST);
