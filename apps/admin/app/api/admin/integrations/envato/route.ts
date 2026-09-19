import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { toErrorMessage } from '@/lib/safe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ENVATO_API = 'https://api.envato.com';
const MAX_RESULTS = 100;

type JsonObject = Record<string, unknown>;

class EnvatoRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'EnvatoRequestError';
    this.status = status;
  }
}

function envatoToken() {
  const value = process.env.ENVATO_API_TOKEN?.trim();
  if (!value) throw new EnvatoRequestError('ENVATO_API_TOKEN is not configured', 503);
  return value;
}

function asObject(value: unknown): JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonObject
    : {};
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

async function envatoGet(path: string, params = new URLSearchParams()): Promise<JsonObject> {
  const url = new URL(path, ENVATO_API);
  params.forEach((value, key) => url.searchParams.set(key, value));

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${envatoToken()}`,
      Accept: 'application/json',
      'User-Agent': 'Elevate Course Builder/1.0',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  });

  const payload = asObject(await response.json().catch(() => ({})));
  if (!response.ok) {
    const retryAfter = response.headers.get('retry-after');
    const description = asString(payload.error_description)
      || asString(payload.error)
      || `Envato returned HTTP ${response.status}`;
    throw new EnvatoRequestError(
      response.status === 429 && retryAfter
        ? `${description}. Try again in ${retryAfter} seconds.`
        : description,
      response.status,
    );
  }
  return payload;
}

function normalizePurchase(value: unknown) {
  const purchase = asObject(value);
  const item = asObject(purchase.item);
  return {
    itemId: String(item.id ?? ''),
    title: asString(item.name) || asString(item.title) || 'Purchased item',
    url: asString(item.url),
    thumbnail: asString(item.thumbnail_url),
    site: asString(item.site),
    purchaseCode: asString(purchase.code) || asString(purchase.purchase_code),
    purchasedAt: asString(purchase.sold_at) || asString(purchase.purchase_date),
    supportedUntil: asString(purchase.supported_until),
  };
}

export async function GET(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;

  try {
    const action = request.nextUrl.searchParams.get('action') || 'status';

    if (action === 'status') {
      const payload = await envatoGet('/v1/market/private/user/username.json');
      return NextResponse.json({
        connected: true,
        username: asString(payload.username),
        provider: 'Envato Market',
      });
    }

    if (action === 'purchases') {
      const requestedPage = Number(request.nextUrl.searchParams.get('page') || '1');
      const page = Number.isFinite(requestedPage) ? Math.max(1, Math.floor(requestedPage)) : 1;
      const payload = await envatoGet(
        '/v3/market/buyer/list-purchases',
        new URLSearchParams({ page: String(page), page_size: String(MAX_RESULTS) }),
      );
      const results = Array.isArray(payload.results) ? payload.results : [];
      return NextResponse.json({
        connected: true,
        page,
        count: results.length,
        purchases: results.map(normalizePurchase),
      });
    }

    if (action === 'download') {
      const itemId = request.nextUrl.searchParams.get('itemId')?.trim() || '';
      const purchaseCode = request.nextUrl.searchParams.get('purchaseCode')?.trim() || '';
      if (!itemId && !purchaseCode) {
        return NextResponse.json({ error: 'itemId or purchaseCode is required' }, { status: 400 });
      }

      const params = itemId
        ? new URLSearchParams({ item_id: itemId })
        : new URLSearchParams({ purchase_code: purchaseCode });
      const payload = await envatoGet('/v3/market/buyer/download', params);
      const downloadUrl = asString(payload.download_url);
      if (!downloadUrl.startsWith('https://')) {
        return NextResponse.json(
          { error: 'Envato did not return a secure download URL for this purchase' },
          { status: 502 },
        );
      }
      return NextResponse.json({ downloadUrl });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error) {
    const status = error instanceof EnvatoRequestError ? error.status : 502;
    return NextResponse.json(
      { connected: false, error: toErrorMessage(error) },
      { status: status >= 400 && status <= 599 ? status : 502 },
    );
  }
}
