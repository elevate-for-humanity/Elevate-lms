export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

const execFileAsync = promisify(execFile);

// Allowed file types
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Sanitize text for TTS - remove potentially dangerous characters
 */
function sanitizeText(text: string): string {
  // Remove shell metacharacters and limit length
  return text
    .replace(/[`$\\;"'|&<>]/g, '')
    .slice(0, 5000);
}

/**
 * Validate volume is a safe number
 */
function sanitizeVolume(vol: string | null, defaultVal: number): number {
  const parsed = parseFloat(vol || String(defaultVal));
  if (isNaN(parsed) || parsed < 0 || parsed > 2) {
    return defaultVal;
  }
  return parsed;
}

export async function POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    // Authentication check - require admin role
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin role
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    const voiceoverFile = formData.get('voiceover') as File | null;
    const musicFile = formData.get('music') as File | null;
    const voiceoverText = formData.get('voiceoverText') as string | null;
    const musicVolume = sanitizeVolume(formData.get('musicVolume') as string, 0.3);
    const voiceoverVolume = sanitizeVolume(formData.get('voiceoverVolume') as string, 1.0);

    if (!videoFile) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    // Validate video file
    if (!ALLOWED_VIDEO_TYPES.includes(videoFile.type)) {
      return NextResponse.json(
        { error: 'Invalid video type. Allowed: MP4, WebM, QuickTime' },
        { status: 400 }
      );
    }

    if (videoFile.size > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        { error: 'Video too large. Maximum size is 500MB' },
        { status: 400 }
      );
    }

    // Validate audio files if provided
    if (voiceoverFile) {
      if (!ALLOWED_AUDIO_TYPES.includes(voiceoverFile.type)) {
        return NextResponse.json(
          { error: 'Invalid voiceover type. Allowed: MP3, WAV, OGG' },
          { status: 400 }
        );
      }
      if (voiceoverFile.size > MAX_AUDIO_SIZE) {
        return NextResponse.json(
          { error: 'Voiceover too large. Maximum size is 50MB' },
          { status: 400 }
        );
      }
    }

    if (musicFile) {
      if (!ALLOWED_AUDIO_TYPES.includes(musicFile.type)) {
        return NextResponse.json(
          { error: 'Invalid music type. Allowed: MP3, WAV, OGG' },
          { status: 400 }
        );
      }
      if (musicFile.size > MAX_AUDIO_SIZE) {
        return NextResponse.json(
          { error: 'Music file too large. Maximum size is 50MB' },
          { status: 400 }
        );
      }
    }

    // Create uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'videos');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate safe filenames (no user input)
    const timestamp = Date.now();
    const randomId = crypto.randomUUID().replace(/-/g, '').slice(0, 12);

    // Save video file
    const videoBytes = await videoFile.arrayBuffer();
    const videoBuffer = Buffer.from(videoBytes);
    const videoFilename = `video-${timestamp}-${randomId}.mp4`;
    const videoPath = path.join(uploadsDir, videoFilename);
    await writeFile(videoPath, videoBuffer);

    let voiceoverPath = '';
    let musicPath = '';
    let generatedVoiceover = false;

    // Save or generate voiceover
    if (voiceoverFile) {
      const voiceoverBytes = await voiceoverFile.arrayBuffer();
      const voiceoverBuffer = Buffer.from(voiceoverBytes);
      const voiceoverFilename = `voiceover-${timestamp}-${randomId}.mp3`;
      voiceoverPath = path.join(uploadsDir, voiceoverFilename);
      await writeFile(voiceoverPath, voiceoverBuffer);
    } else if (voiceoverText) {
      // Generate voiceover using text-to-speech
      const voiceoverFilename = `voiceover-${timestamp}-${randomId}.mp3`;
      voiceoverPath = path.join(uploadsDir, voiceoverFilename);
      const sanitizedText = sanitizeText(voiceoverText);

      try {
        // Use execFile with arguments array to prevent command injection
        await execFileAsync('edge-tts', [
          '--text', sanitizedText,
          '--write-media', voiceoverPath,
          '--voice', 'en-US-GuyNeural'
        ]);
        generatedVoiceover = true;
      } catch (ttsError) {
        logger.error('TTS generation failed:', ttsError);
        voiceoverPath = '';
      }
    }

    // Save music file
    if (musicFile) {
      const musicBytes = await musicFile.arrayBuffer();
      const musicBuffer = Buffer.from(musicBytes);
      const musicFilename = `music-${timestamp}-${randomId}.mp3`;
      musicPath = path.join(uploadsDir, musicFilename);
      await writeFile(musicPath, musicBuffer);
    }

    // Enhanced output filename
    const enhancedFilename = `enhanced-full-${timestamp}-${randomId}.mp4`;
    const enhancedPath = path.join(uploadsDir, enhancedFilename);

    // Build FFmpeg arguments array (safe from injection)
    const ffmpegArgs: string[] = ['-i', videoPath];
    
    // Track audio inputs
    const hasVoiceover = voiceoverPath && existsSync(voiceoverPath);
    const hasMusic = musicPath && existsSync(musicPath);

    if (hasVoiceover) {
      ffmpegArgs.push('-i', voiceoverPath);
    }
    if (hasMusic) {
      ffmpegArgs.push('-i', musicPath);
    }

    // Video enhancement filters
    const videoFilters = [
      'scale=1920:1080:force_original_aspect_ratio=decrease',
      'pad=1920:1080:(ow-iw)/2:(oh-ih)/2',
      'hqdn3d=4:3:6:4.5',
      'eq=contrast=1.1:brightness=0.05:saturation=1.2',
      'unsharp=5:5:1.0:5:5:0.0',
    ].join(',');

    // Build filter complex
    let filterComplex = `[0:v]${videoFilters}[v]`;
    let audioInputs = 0;

    if (hasVoiceover && hasMusic) {
      filterComplex += `;[1:a]volume=${voiceoverVolume}[vo];[2:a]volume=${musicVolume},aloop=loop=-1:size=2e+09[music];[vo][music]amix=inputs=2:duration=first:dropout_transition=2[a]`;
      audioInputs = 2;
    } else if (hasVoiceover) {
      filterComplex += `;[1:a]volume=${voiceoverVolume}[a]`;
      audioInputs = 1;
    } else if (hasMusic) {
      filterComplex += `;[1:a]volume=${musicVolume},aloop=loop=-1:size=2e+09[a]`;
      audioInputs = 1;
    }

    ffmpegArgs.push('-filter_complex', filterComplex);
    ffmpegArgs.push('-map', '[v]');
    
    if (audioInputs > 0) {
      ffmpegArgs.push('-map', '[a]');
    }

    // Output settings
    ffmpegArgs.push(
      '-c:v', 'libx264',
      '-preset', 'slow',
      '-crf', '18',
      '-b:v', '8M',
      '-maxrate', '10M',
      '-bufsize', '16M'
    );

    if (audioInputs > 0) {
      ffmpegArgs.push('-c:a', 'aac', '-b:a', '192k');
    }

    ffmpegArgs.push('-movflags', '+faststart', '-shortest', enhancedPath);

    logger.info('Processing video with full enhancement...', { userId: user.id });

    try {
      await execFileAsync('ffmpeg', ffmpegArgs, {
        maxBuffer: 50 * 1024 * 1024,
      });

      logger.info('Video processed successfully', { userId: user.id, filename: enhancedFilename });

      return NextResponse.json({
        success: true,
        originalUrl: `/uploads/videos/${videoFilename}`,
        enhancedUrl: `/uploads/videos/${enhancedFilename}`,
        hasVoiceover: !!hasVoiceover,
        hasMusic: !!hasMusic,
        generatedVoiceover,
        message: 'Video fully enhanced with audio!',
        details: {
          videoEnhancement: 'Upscaled to 1080p, denoised, color-corrected, sharpened',
          audio: audioInputs > 0 ? 'Voiceover and/or music added' : 'No audio',
          voiceoverVolume,
          musicVolume,
        },
      });
    } catch (err: any) {
      logger.error('FFmpeg error:', err);

      return NextResponse.json(
        {
          success: false,
          error: 'Video processing failed',
          details: err?.message || 'Unknown error',
          originalUrl: `/uploads/videos/${videoFilename}`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Video processing error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to process video', details: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
