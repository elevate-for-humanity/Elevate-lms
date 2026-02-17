import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { cloudflareStream } from '@/server/cloudflare-stream';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';

/**
 * AI Video Generation API
 *
 * Generates videos from text prompts using:
 * 1. Local FFmpeg-based generation (free, immediate)
 * 2. Cloudflare Stream for storage and delivery
 * 3. Optional: Runway ML integration (premium)
 * 4. Optional: Synthesia integration (premium)
 */

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const {
      prompt,
      duration = 30,
      aspectRatio = '16:9',
      style = 'professional',
    } = await request.json();

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Generate video locally
    const localVideoPath = await generateVideoLocally(
      prompt,
      duration,
      aspectRatio,
      style
    );

    // Upload to Cloudflare Stream if configured
    let videoUrl = localVideoPath;
    let thumbnail = localVideoPath.replace('.mp4', '-thumb.jpg');
    let streamId = null;

    if (cloudflareStream) {
      try {
        const streamVideo = await cloudflareStream.uploadVideo(localVideoPath, {
          name: `AI Generated: ${prompt.substring(0, 50)}`,
          title: prompt,
          requireSignedURLs: false,
        });

        streamId = streamVideo.uid;
        videoUrl = cloudflareStream.getVideoUrl(streamVideo.uid);
        thumbnail = cloudflareStream.getThumbnailUrl(streamVideo.uid);

        logger.info(`Video uploaded to Cloudflare Stream: ${streamId}`);
      } catch (error) {
        logger.error(
          'Cloudflare Stream upload failed, using local URL:',
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }

    return NextResponse.json({
      success: true,
      videoUrl,
      thumbnail,
      streamId,
      duration,
      aspectRatio,
      style,
      prompt,
      storage: streamId ? 'cloudflare-stream' : 'local',
    });
  } catch (error) {
    logger.error(
      'Video generation error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to generate video' },
      { status: 500 }
    );
  }
}

async function generateVideoLocally(
  prompt: string,
  duration: number,
  aspectRatio: string,
  style: string
): Promise<string> {
  // This uses the existing video generator
  // You can call your server/video-generator.ts here

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/video/generate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenes: [
          {
            id: '1',
            type: 'content',
            duration,
            script: prompt,
            voiceOver: true,
            background: getBackgroundForStyle(style),
            textPosition: 'center',
            animation: 'fade',
          },
        ],
        format: aspectRatio,
        resolution: '1080p',
        backgroundMusic: true,
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Video generation failed');
  }

  const data = await response.json();
  return data.videoUrl;
}

function getBackgroundForStyle(style: string): string {
  const backgrounds: Record<string, string> = {
    professional: '#1e3a8a',
    cinematic: '#000000',
    animated: '#6366f1',
    documentary: '#374151',
    'social-media': '#ec4899',
    educational: '#059669',
  };

  return backgrounds[style] || '#1e3a8a';
}

/**
 * Premium Integration Examples (commented out - add API keys to use)
 */

// async function generateWithRunway(prompt: string, duration: number): Promise<string> {
//   const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;
//
//   if (!RUNWAY_API_KEY) {
//     throw new Error('Runway API key not configured');
//   }
//
//   const response = await fetch('https://api.runwayml.com/v1/generate', {
//     method: 'POST',
//     headers: {
//       'Authorization': `Bearer ${RUNWAY_API_KEY}`,
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       prompt,
//       duration,
//       model: 'gen-2',
//     }),
//   });
//
//   const data = await response.json();
//   return data.video_url;
// }

// async function generateWithSynthesia(prompt: string, duration: number): Promise<string> {
//   const SYNTHESIA_API_KEY = process.env.SYNTHESIA_API_KEY;
//
//   if (!SYNTHESIA_API_KEY) {
//     throw new Error('Synthesia API key not configured');
//   }
//
//   const response = await fetch('https://api.synthesia.io/v2/videos', {
//     method: 'POST',
//     headers: {
//       'Authorization': SYNTHESIA_API_KEY,
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       input: [{ scriptText: prompt }],
//       avatar: 'anna_costume1_cameraA',
//       background: 'green_screen',
//     }),
//   });
//
//   const data = await response.json();
//   return data.download;
// }
