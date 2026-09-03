import { NextRequest, NextResponse } from 'next/server';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

export async function GET(request: NextRequest) {
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

  // If no Pexels API key, return demo data
  if (!PEXELS_API_KEY) {
    return NextResponse.json({
      success: true,
      source: 'demo',
      query,
      total_results: 100,
      page: parseInt(page),
      per_page: parseInt(perPage),
      photos: generateDemoPhotos(parseInt(perPage)),
    });
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
    
    // Fallback to demo data
    return NextResponse.json({
      success: true,
      source: 'demo',
      query,
      total_results: 100,
      page: parseInt(page),
      per_page: parseInt(perPage),
      photos: generateDemoPhotos(parseInt(perPage)),
    });
  }
}

// Generate demo photos for testing
function generateDemoPhotos(count: number) {
  const categories = [
    { query: 'professional workplace', color: '1a365d' },
    { query: 'students learning', color: '2c5282' },
    { query: 'healthcare training', color: '38a169' },
    { query: 'construction work', color: 'd69e2e' },
    { query: 'technology office', color: '805ad5' },
  ];

  const photos = [];
  for (let i = 0; i < count; i++) {
    const category = categories[i % categories.length];
    const width = [800, 1200, 1600][i % 3];
    const height = [600, 800, 900][i % 3];
    
    photos.push({
      id: `demo_${i}`,
      url: `https://picsum.photos/seed/${category.query}/${width}/${height}`,
      thumbnail: `https://picsum.photos/seed/${category.query}/400/300`,
      alt: `${category.query} professional photo`,
      photographer: 'Demo Photographer',
      photographer_url: 'https://example.com',
      width,
      height,
      avg_color: `#${category.color}`,
      source: 'demo',
    });
  }

  return photos;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, imageUrl, prompt, type } = body;

    if (action === 'generate') {
      // AI image generation would go here
      // For now, return demo data
      return NextResponse.json({
        success: true,
        action: 'generate',
        imageUrl: `https://picsum.photos/1920/1080?random=${Date.now()}`,
        prompt,
        type,
        message: 'Image generated successfully!',
      });
    }

    if (action === 'edit') {
      // Image editing would go here
      return NextResponse.json({
        success: true,
        action: 'edit',
        imageUrl,
        edits: body.edits,
        message: 'Image edited successfully!',
      });
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
