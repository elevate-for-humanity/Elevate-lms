import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

export async function GET(request: NextRequest) {
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');
  const page = searchParams.get('page') || '1';
  const perPage = searchParams.get('per_page') || '20';
  const orientation = searchParams.get('orientation');

  if (!query) {
    return NextResponse.json({ 
      success: false, 
      error: 'Query is required' 
    }, { status: 400 });
  }

  // Never present synthetic demo assets as live provider results.
  if (!PEXELS_API_KEY) {
    return NextResponse.json(
      { success: false, configured: false, error: 'Media search is not configured' },
      { status: 503 },
    );
  }

  try {
    const params = new URLSearchParams({
      query,
      page,
      per_page: perPage,
    });
    
    if (orientation) {
      params.set('orientation', orientation);
    }

    const response = await fetch(`https://api.pexels.com/v1/search?${params}`, {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      source: 'pexels',
      query,
      total_results: data.total_results,
      page: data.page,
      per_page: data.per_page,
      photos: data.photos.map((photo: any) => ({
        id: `pexels_${photo.id}`,
        url: photo.src.large2x,
        thumbnail: photo.src.medium,
        alt: photo.alt,
        photographer: photo.photographer,
        photographer_url: photo.photographer_url,
        width: photo.width,
        height: photo.height,
        avg_color: photo.avg_color,
        source: 'pexels',
      })),
    });

  } catch (error) {
    console.error('Media search error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Media search provider is unavailable' },
      { status: 502 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'generate') {
      return NextResponse.json(
        { success: false, action: 'generate', error: 'Image generation is not configured' },
        { status: 501 },
      );
    }

    if (action === 'edit') {
      return NextResponse.json(
        { success: false, action: 'edit', error: 'Image editing is not configured' },
        { status: 501 },
      );
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Invalid action' 
    }, { status: 400 });

  } catch (error) {
    console.error('Media API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
