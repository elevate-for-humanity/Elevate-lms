import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/with-auth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { toErrorMessage } from '@/lib/safe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ENVATO_API = 'https://api.envato.com';
const MAX_RESULTS = 100;

function token() {
  const value = process.env.ENVATO_API_TOKEN?.trim();
  if (!value) throw new Error('ENVATO_API_TOKEN is not configured');
  return value;
}

async function envatoGet(path: string, params?: URLSearchParams) {
  const url = new URL(path, ENVATO_API);
  params?.forEach((value, key) => url.searchParams.set(key, value));
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token()}`,
      Accept: 'application/json',
      'User-Agent': 'Elevate Course Builder/1.0',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  });
  const retryAfter = response.headers.get('retry-after');
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    const description = String(payload.error_description ?? payload.error ?? `Envato returned HTTP ${response.status}`);
    const error = new Error(response.status === 429 && retryAfter
      ? `${description}. Try again in ${retryAfter} seconds.`
      : description);
    Object.assign(error, { status: response.status });
    throw error;
  }
  return payload;
}

function safeText(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function normalizePurchase(value: unknown) {
  const row = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const item = row.item && typeof row.item === 'object' ? row.item as Record<string, unknown> : {};
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

const _GET = withAuth(async (request: NextRequest) => {
  const limited = await applyRateLimit(request, 'standard');
  if (limited) return limited;
  try {
    const action = request.nextUrl.searchParams.get('action') || 'status';

    if (action === 'status') {
      const usernamePayload = await envatoGet('/v1/market/private/user/username.json');
      return NextResponse.json({
        connected: true,
        username: safeText(usernamePayload.username),
        provider: 'Envato Market',
      });
    }

    if (action === 'purchases') {
      const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') || 1));
      const payload = await envatoGet('/v3/market/buyer/list-purchases', new URLSearchParams({
        page: String(page),
        page_size: String(MAX_RESULTS),
      }));
      const rows = Array.isArray(payload.results) ? payload.results : [];
      return NextResponse.json({
        connected: true,
        page,
        purchases: rows.map(normalizePurchase),
        count: rows.length,
      });
    }

    if (action === 'download') {
      const itemId = request.nextUrl.searchParams.get('itemId')?.trim() || '';
      const purchaseCode = request.nextUrl.searchParams.get('purchaseCode')?.trim() || '';
      if (!itemId && !purchaseCode) {
        return NextResponse.json({ error: 'itemId or purchaseCode is required' }, { status: 400 });
      }
      const params = new URLSearchParams(itemId ? { item_id: itemId } : { purchase_code: purchaseCode });
      const payload = await envatoGet('/v3/market/buyer/download', params);
      const downloadUrl = safeText(payload.download_url);
      if (!downloadUrl || !downloadUrl.startsWith('https://')) {
        return NextResponse.json({ error: 'Envato did not return a secure download URL for this purchase' }, { status: 502 });
      }
      return NextResponse.json({ downloadUrl });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error) {
    const status = typeof error === 'object' && error && 'status' in error
      ? Number((error as { status?: unknown }).status) || 502
      : 502;
    return NextResponse.json({ connected: false, error: toErrorMessage(error) }, { status });
  }
}, { roles: ['admin'] });

export const GET = withApiAudit('/api/admin/integrations/envato', _GET);
