import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
const HEYGEN_API_URL = 'https://api.heygen.com/v2/video/generate';

interface VideoGenerateRequest {
  title: string;
  script: string;
  avatarId?: string;
  voiceId?: string;
  background?: string;
}

export async function POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;

  if (!HEYGEN_API_KEY) {
    return NextResponse.json({ error: 'HeyGen API key not configured' }, { status: 500 });
  }

  try {
    const body: VideoGenerateRequest = await request.json();
    const { title, script, avatarId = 'Angela-inblackskirt-20220820', voiceId, background } = body;

    const payload = {
      video_inputs: [
        {
          character: {
            type: 'avatar',
            avatar_id: avatarId,
            avatar_style: 'normal',
          },
          voice: {
            type: 'text',
            input_text: script,
            voice_id: voiceId || '1bd001e7e50f421d891986aad5158bc8', // Default professional voice
            speed: 1.0,
          },
          background: background ? {
            type: 'image',
            url: background,
          } : {
            type: 'color',
            value: '#1e3a5f',
          },
        },
      ],
      dimension: {
        width: 1920,
        height: 1080,
      },
      aspect_ratio: '16:9',
      test: false,
    };

    const response = await fetch(HEYGEN_API_URL, {
      method: 'POST',
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.message || 'Failed to generate video' }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      videoId: data.data?.video_id,
      message: 'Video generation started',
      title,
    });
  } catch (error) {
    logger.error('HeyGen API error:', error);
    return NextResponse.json({ error: 'Failed to generate video' }, { status: 500 });
  }
}
