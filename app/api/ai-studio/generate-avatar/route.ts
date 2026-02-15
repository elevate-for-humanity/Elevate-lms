import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { generateTextToSpeech } from '@/server/tts-service';
import { cloudflareStream } from '@/server/cloudflare-stream';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

const execAsync = promisify(exec);

/**
 * AI Avatar / Talking Head Generation
 *
 * Creates videos with AI avatars speaking your text
 * Uses:
 * 1. Local TTS + static avatar image (free)
 * 2. Cloudflare Stream for storage and delivery
 * 3. Optional: D-ID integration (premium)
 * 4. Optional: Synthesia integration (premium)
 */

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const {
      prompt,
      duration = 30,
      voice = 'alloy',
      avatar = 'professional',
    } = await request.json();

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text prompt is required' },
        { status: 400 }
      );
    }

    // Generate avatar video locally
    const localVideoPath = await generateAvatarLocally(prompt, voice, avatar);

    // Upload to Cloudflare Stream if configured
    let videoUrl = localVideoPath;
    let thumbnail = localVideoPath.replace('.mp4', '-thumb.jpg');
    let streamId = null;

    if (cloudflareStream) {
      try {
        const streamVideo = await cloudflareStream.uploadVideo(localVideoPath, {
          name: `AI Avatar: ${prompt.substring(0, 50)}`,
          title: `Avatar - ${voice}`,
          requireSignedURLs: false,
        });

        streamId = streamVideo.uid;
        videoUrl = cloudflareStream.getVideoUrl(streamVideo.uid);
        thumbnail = cloudflareStream.getThumbnailUrl(streamVideo.uid);

        logger.info(`Avatar video uploaded to Cloudflare Stream: ${streamId}`);
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
      voice,
      avatar,
      prompt,
      storage: streamId ? 'cloudflare-stream' : 'local',
    });
  } catch (error) {
    logger.error(
      'Avatar generation error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to generate avatar video' },
      { status: 500 }
    );
  }
}

async function generateAvatarLocally(
  text: string,
  voice: string,
  avatarStyle: string
): Promise<string> {
  // Create output directory
  const outputDir = path.join(process.cwd(), 'public', 'generated', 'avatars');
  await mkdir(outputDir, { recursive: true });

  const timestamp = Date.now();
  const audioPath = path.join(outputDir, `audio-${timestamp}.mp3`);
  const videoPath = path.join(outputDir, `avatar-${timestamp}.mp4`);

  // Generate audio with TTS
  const audioBuffer = await generateTextToSpeech(text, voice, 1.0);
  await writeFile(audioPath, audioBuffer);

  // Get avatar image based on style
  const avatarImage = getAvatarImage(avatarStyle);

  // Create video with static avatar + audio using FFmpeg
  // This creates a simple talking head effect with subtle zoom
  const ffmpegCommand = `ffmpeg -loop 1 -i "${avatarImage}" -i "${audioPath}" \
    -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,zoompan=z='min(zoom+0.0015,1.5)':d=1:s=1920x1080" \
    -c:v libx264 -preset medium -crf 23 \
    -c:a aac -b:a 192k \
    -shortest \
    -movflags +faststart \
    "${videoPath}"`;

  await execAsync(ffmpegCommand);

  // Return public URL
  return `/generated/avatars/avatar-${timestamp}.mp4`;
}

function getAvatarImage(style: string): string {
  // Map styles to avatar images
  // You can add custom avatar images to public/avatars/
  const avatars: Record<string, string> = {
    professional: path.join(
      process.cwd(),
      'public',
      'avatars',
      'professional.jpg'
    ),
    friendly: path.join(process.cwd(), 'public', 'avatars', 'friendly.jpg'),
    instructor: path.join(process.cwd(), 'public', 'avatars', 'instructor.jpg'),
    default: path.join(process.cwd(), 'public', 'avatars', 'default.jpg'),
  };

  return avatars[style] || avatars.default;
}

/**
 * Premium Integration - D-ID (Talking Head Cloning)
 */
async function generateWithDID(
  text: string,
  voice: string,
  avatarImageUrl: string
): Promise<string> {
  const DID_API_KEY = process.env.DID_API_KEY;

  if (!DID_API_KEY) {
    throw new Error('D-ID API key not configured');
  }

  // Create talk
  const createResponse = await fetch('https://api.d-id.com/talks', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${DID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      script: {
        type: 'text',
        input: text,
        provider: {
          type: 'microsoft',
          voice_id: voice,
        },
      },
      source_url: avatarImageUrl,
    }),
  });

  if (!createResponse.ok) {
    throw new Error('D-ID API error');
  }

  const { id } = await createResponse.json();

  // Poll for completion
  let videoUrl = '';
  for (let i = 0; i < 60; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const statusResponse = await fetch(`https://api.d-id.com/talks/${id}`, {
      headers: {
        Authorization: `Basic ${DID_API_KEY}`,
      },
    });

    const status = await statusResponse.json();

    if (status.status === 'done') {
      videoUrl = status.result_url;
      break;
    } else if (status.status === 'error') {
      throw new Error(`D-ID generation failed: ${status.error}`);
    }
  }

  if (!videoUrl) {
    throw new Error('D-ID generation timeout');
  }

  return videoUrl;
}

/**
 * Premium Integration - Synthesia (AI Avatar)
 */
async function generateWithSynthesia(
  text: string,
  avatarId: string = 'anna_costume1_cameraA'
): Promise<string> {
  const SYNTHESIA_API_KEY = process.env.SYNTHESIA_API_KEY;

  if (!SYNTHESIA_API_KEY) {
    throw new Error('Synthesia API key not configured');
  }

  const response = await fetch('https://api.synthesia.io/v2/videos', {
    method: 'POST',
    headers: {
      Authorization: SYNTHESIA_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: [{ scriptText: text }],
      avatar: avatarId,
      background: 'green_screen',
    }),
  });

  if (!response.ok) {
    throw new Error('Synthesia API error');
  }

  const data = await response.json();
  const videoId = data.id;

  // Poll for completion
  for (let i = 0; i < 120; i++) {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const statusResponse = await fetch(
      `https://api.synthesia.io/v2/videos/${videoId}`,
      {
        headers: {
          Authorization: SYNTHESIA_API_KEY,
        },
      }
    );

    const status = await statusResponse.json();

    if (status.status === 'complete') {
      return status.download;
    } else if (status.status === 'failed') {
      throw new Error('Synthesia generation failed');
    }
  }

  throw new Error('Synthesia generation timeout');
}
