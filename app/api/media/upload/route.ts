import { NextRequest, NextResponse } from 'next/server';


import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

// Allowed MIME types for media uploads
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/webm', 'video/quicktime',
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
  'application/pdf',
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// Allowed bucket names (whitelist)
const ALLOWED_BUCKETS = ['media', 'documents', 'avatars', 'course-content'];

// Allowed folder patterns
const ALLOWED_FOLDER_PATTERN = /^[a-zA-Z0-9_-]+$/;

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const form = await req.formData();
    const file = form.get('file') as File;
    const folder = (form.get('folder') as string) || 'uploads';
    const bucket = (form.get('bucket') as string) || 'media';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 100MB' },
        { status: 400 }
      );
    }

    // Validate bucket (whitelist)
    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return NextResponse.json(
        { error: 'Invalid storage bucket' },
        { status: 400 }
      );
    }

    // Validate folder name (prevent path traversal)
    if (!ALLOWED_FOLDER_PATTERN.test(folder) || folder.includes('..')) {
      return NextResponse.json(
        { error: 'Invalid folder name' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Generate secure unique filename (no user input in path)
    const timestamp = Date.now();
    const randomId = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
    const filename = `${timestamp}-${randomId}.${extension}`;
    const storagePath = `${folder}/${filename}`;

    // Upload to Supabase Storage
    const { data, error }: any = await supabase.storage
      .from(bucket)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
        cacheControl: '3600',
      });

    if (error) {
      logger.error('Upload error:', error);
      return NextResponse.json(
        { error: toErrorMessage(error) },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(storagePath);

    logger.info('Media uploaded successfully', {
      userId: user.id,
      filename,
      size: file.size,
      type: file.type,
    });

    return NextResponse.json({
      ok: true,
      path: data.path,
      url: publicUrl,
      filename,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    logger.error('Upload error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to upload file', message: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/media/upload', _POST);
