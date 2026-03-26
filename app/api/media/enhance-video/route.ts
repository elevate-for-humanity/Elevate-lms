
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

const execFileAsync = promisify(execFile);

// Allowed video MIME types
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB

/**
 * Validate filename to prevent path traversal
 */
function isValidFilename(filename: string): boolean {
  // Only allow alphanumeric, dash, underscore, and dot
  const safePattern = /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/;
  return safePattern.test(filename) && !filename.includes('..');
}

async function _POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    // Authentication check - require admin role
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin role
    const { data: profile } = await supabase
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
    const file = formData.get('video') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid video type. Allowed: MP4, WebM, QuickTime' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        { error: 'Video too large. Maximum size is 500MB' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'videos');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate safe filenames (no user input)
    const timestamp = Date.now();
    const randomId = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    const originalFilename = `original-${timestamp}-${randomId}.mp4`;
    const enhancedFilename = `enhanced-${timestamp}-${randomId}.mp4`;
    
    const originalPath = path.join(uploadsDir, originalFilename);
    const enhancedPath = path.join(uploadsDir, enhancedFilename);

    // Save original file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(originalPath, buffer);

    logger.info('Enhancing video with FFmpeg...', { userId: user.id });

    try {
      // Use execFile with arguments array to prevent command injection
      await execFileAsync('ffmpeg', [
        '-i', originalPath,
        '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,hqdn3d=4:3:6:4.5,eq=contrast=1.1:brightness=0.05:saturation=1.2',
        '-c:v', 'libx264',
        '-preset', 'slow',
        '-crf', '18',
        '-b:v', '8M',
        '-maxrate', '10M',
        '-bufsize', '16M',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-movflags', '+faststart',
        enhancedPath
      ]);
      
      logger.info('Video enhanced successfully', { userId: user.id, filename: enhancedFilename });

      return NextResponse.json({
        success: true,
        originalUrl: `/uploads/videos/${originalFilename}`,
        enhancedUrl: `/uploads/videos/${enhancedFilename}`,
        message: 'Video enhanced successfully! Quality improved, upscaled to 1080p, denoised, and color-corrected.',
      });
    } catch (err: any) {
      logger.error('FFmpeg error:', err);

      // If FFmpeg fails, return the original
      return NextResponse.json({
        success: true,
        originalUrl: `/uploads/videos/${originalFilename}`,
        enhancedUrl: `/uploads/videos/${originalFilename}`,
        message: 'Video uploaded. Enhancement unavailable - using original.',
        warning: 'FFmpeg not available or enhancement failed',
      });
    }
  } catch (error) {
    logger.error('Video upload error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to process video', details: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

// Get video info
async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    // Authentication check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: 'Filename required' }, { status: 400 });
    }

    // Validate filename to prevent path traversal
    if (!isValidFilename(filename)) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const videoPath = path.join(process.cwd(), 'public', 'uploads', 'videos', filename);

    if (!existsSync(videoPath)) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    try {
      // Use execFile with arguments array to prevent command injection
      const { stdout } = await execFileAsync('ffprobe', [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        videoPath
      ]);

      const metadata = JSON.parse(stdout);

      return NextResponse.json({
        success: true,
        metadata: {
          duration: metadata.format?.duration,
          size: metadata.format?.size,
          bitrate: metadata.format?.bit_rate,
          width: metadata.streams?.[0]?.width,
          height: metadata.streams?.[0]?.height,
          codec: metadata.streams?.[0]?.codec_name,
        },
      });
    } catch (error) {
      return NextResponse.json({
        success: true,
        message: 'Video exists but metadata unavailable',
      });
    }
  } catch (error) {
    logger.error('Video info error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to get video info' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/media/enhance-video', _GET);
export const POST = withApiAudit('/api/media/enhance-video', _POST);
