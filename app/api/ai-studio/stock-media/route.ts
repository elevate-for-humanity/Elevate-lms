import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Stock Media Library API
 *
 * Integrates with free stock media providers:
 * - Pexels (videos & photos)
 * - Unsplash (photos)
 * - Pixabay (videos, photos, music)
 */

async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || 'business';
    const type = searchParams.get('type') || 'photos'; // photos, videos, music
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('perPage') || '20', 10);

    let results: any[] = [];

    switch (type) {
      case 'photos':
        results = await searchPhotos(query, page, perPage);
        break;
      case 'videos':
        results = await searchVideos(query, page, perPage);
        break;
      case 'music':
        results = await searchMusic(query, page, perPage);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: photos, videos, or music' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      query,
      type,
      page,
      perPage,
      results,
      total: results.length,
    });
  } catch (error) {
    logger.error(
      'Stock media search error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: 'Failed to search stock media' },
      { status: 500 }
    );
  }
}

async function searchPhotos(query: string, page: number, perPage: number) {
  const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
  const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

  // Try Pexels first (free, no attribution required)
  if (PEXELS_API_KEY) {
    try {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`,
        {
          headers: {
            Authorization: PEXELS_API_KEY,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.photos.map((photo: any) => ({
          id: photo.id,
          type: 'photo',
          url: photo.src.large,
          thumbnail: photo.src.medium,
          width: photo.width,
          height: photo.height,
          photographer: photo.photographer,
          photographerUrl: photo.photographer_url,
          source: 'pexels',
        }));
      }
    } catch (error) {
      logger.error(
        'Pexels API error:',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  // Fallback to Unsplash
  if (UNSPLASH_ACCESS_KEY) {
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`,
        {
          headers: {
            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.results.map((photo: any) => ({
          id: photo.id,
          type: 'photo',
          url: photo.urls.regular,
          thumbnail: photo.urls.small,
          width: photo.width,
          height: photo.height,
          photographer: photo.user.name,
          photographerUrl: photo.user.links.html,
          source: 'unsplash',
        }));
      }
    } catch (error) {
      logger.error(
        'Unsplash API error:',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  // Return placeholder if no API keys configured
  return getPlaceholderPhotos(query);
}

async function searchVideos(query: string, page: number, perPage: number) {
  const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

  if (PEXELS_API_KEY) {
    try {
      const response = await fetch(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`,
        {
          headers: {
            Authorization: PEXELS_API_KEY,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.videos.map((video: any) => ({
          id: video.id,
          type: 'video',
          url: video.video_files[0]?.link,
          thumbnail: video.image,
          width: video.width,
          height: video.height,
          duration: video.duration,
          videographer: video.user.name,
          videographerUrl: video.user.url,
          source: 'pexels',
        }));
      }
    } catch (error) {
      logger.error(
        'Pexels video API error:',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  return getPlaceholderVideos(query);
}

async function searchMusic(query: string, page: number, perPage: number) {
  const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;

  if (PIXABAY_API_KEY) {
    try {
      const response = await fetch(
        `https://pixabay.com/api/music/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`
      );

      if (response.ok) {
        const data = await response.json();
        return data.hits.map((track: any) => ({
          id: track.id,
          type: 'music',
          url: track.audio,
          thumbnail: track.picture_medium,
          duration: track.duration,
          artist: track.artist,
          title: track.title,
          source: 'pixabay',
        }));
      }
    } catch (error) {
      logger.error(
        'Pixabay API error:',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  return getPlaceholderMusic(query);
}

// Placeholder data when API keys are not configured
function getPlaceholderPhotos(query: string) {
  return [
    {
      id: 'placeholder-1',
      type: 'photo',
      url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
      thumbnail:
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400',
      width: 800,
      height: 600,
      photographer: 'Unsplash',
      photographerUrl: 'https://unsplash.com',
      source: 'placeholder',
      note: 'Configure PEXELS_API_KEY or UNSPLASH_ACCESS_KEY for real stock photos',
    },
  ];
}

function getPlaceholderVideos(query: string) {
  return [
    {
      id: 'placeholder-1',
      type: 'video',
      url: 'https://www.pexels.com/video/3195394/download/',
      thumbnail:
        'https://images.pexels.com/videos/3195394/free-video-3195394.jpg?w=400',
      width: 1920,
      height: 1080,
      duration: 10,
      videographer: 'Pexels',
      videographerUrl: 'https://pexels.com',
      source: 'placeholder',
      note: 'Configure PEXELS_API_KEY for real stock videos',
    },
  ];
}

function getPlaceholderMusic(query: string) {
  return [
    {
      id: 'placeholder-1',
      type: 'music',
      url: '',
      thumbnail: '',
      duration: 120,
      artist: 'Placeholder',
      title: 'Background Music',
      source: 'placeholder',
      note: 'Configure PIXABAY_API_KEY for real stock music',
    },
  ];
}

/**
 * API Key Setup Instructions:
 *
 * 1. Pexels (Free):
 *    - Sign up at https://www.pexels.com/api/
 *    - Add PEXELS_API_KEY to .env.local
 *
 * 2. Unsplash (Free):
 *    - Sign up at https://unsplash.com/developers
 *    - Add UNSPLASH_ACCESS_KEY to .env.local
 *
 * 3. Pixabay (Free):
 *    - Sign up at https://pixabay.com/api/docs/
 *    - Add PIXABAY_API_KEY to .env.local
 */
export const GET = withApiAudit('/api/ai-studio/stock-media', _GET);
