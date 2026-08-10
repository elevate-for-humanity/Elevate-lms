import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const MAX_PER_PAGE = 40;

export async function GET(request: NextRequest) {
  const user = await apiRequireAdmin(request);
  if (user.error) return user.error;

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query')?.trim();
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const perPage = Math.min(MAX_PER_PAGE, Math.max(1, Number(searchParams.get('per_page') || 20)));
  const orientation = searchParams.get('orientation');

  if (!query) {
    return NextResponse.json({ success: false, error: 'Query is required' }, { status: 400 });
  }

  if (!PEXELS_API_KEY) {
    return NextResponse.json(
      {
        success: false,
        configured: false,
        error: 'Media search is not configured. Add PEXELS_API_KEY to the Admin service.',
      },
      { status: 503 },
    );
  }

  try {
    const params = new URLSearchParams({
      query,
      page: String(page),
      per_page: String(perPage),
    });
    if (orientation) params.set('orientation', orientation);

    const response = await fetch(`https://api.pexels.com/v1/search?${params}`, {
      headers: { Authorization: PEXELS_API_KEY },
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'Media provider is temporarily unavailable.' },
        { status: 502 },
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      source: 'pexels',
      query,
      total_results: data.total_results,
      page: data.page,
      per_page: data.per_page,
      photos: Array.isArray(data.photos)
        ? data.photos.map((photo: any) => ({
            id: `pexels_${photo.id}`,
            url: photo.src?.large2x,
            thumbnail: photo.src?.medium,
            alt: photo.alt || 'Stock media result',
            photographer: photo.photographer,
            photographer_url: photo.photographer_url,
            width: photo.width,
            height: photo.height,
            avg_color: photo.avg_color,
            source: 'pexels',
          }))
        : [],
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Media search is temporarily unavailable.' },
      { status: 502 },
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await apiRequireAdmin(request);
  if (user.error) return user.error;

  const body = await request.json().catch(() => ({}));
  const action = String(body.action || '');

  // Image generation/editing is not implemented by this route. Returning a
  // random image as if generation succeeded creates false production state.
  if (action === 'generate' || action === 'edit') {
    return NextResponse.json(
      {
        success: false,
        implemented: false,
        error: 'AI media generation and editing are not configured on this endpoint.',
      },
      { status: 501 },
    );
  }

  return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
}
