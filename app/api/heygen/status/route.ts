import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

export async function GET(request: NextRequest) {
  if (!HEYGEN_API_KEY) {
    return NextResponse.json({ error: 'HeyGen API key not configured' }, { status: 500 });
  }

  const videoId = request.nextUrl.searchParams.get('videoId');
  
  if (!videoId) {
    return NextResponse.json({ error: 'Video ID required' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.message || 'Failed to get video status' }, { status: response.status });
    }

    return NextResponse.json({
      status: data.data?.status,
      videoUrl: data.data?.video_url,
      thumbnailUrl: data.data?.thumbnail_url,
      duration: data.data?.duration,
    });
  } catch (error) {
    logger.error('HeyGen status error:', error);
    return NextResponse.json({ error: 'Failed to get video status' }, { status: 500 });
  }
}
