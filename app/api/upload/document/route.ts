/**
 * Public document upload for provider applications.
 * Accepts PDF/image files, stores in Supabase `provider-documents` bucket,
 * returns a public URL.
 *
 * AUTH_EXEMPT: Intentionally public — unauthenticated applicants upload docs before account creation.
 * Security: rate-limited by IP, file type + size validated, stored in private bucket.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const BUCKET = 'provider-documents';

function sanitize(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .slice(0, 80);
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'contact');
  if (rateLimited) return rateLimited;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return safeError('Invalid form data', 400);
  }

  const file = formData.get('file') as File | null;
  if (!file) return safeError('No file provided', 400);
  if (file.size > MAX_SIZE) return safeError('File exceeds 10 MB limit', 400);
  if (!ALLOWED_TYPES.includes(file.type)) {
    return safeError('Unsupported file type. Accepted: PDF, JPG, PNG, WebP', 400);
  }

  const supabase = await getAdminClient();
  if (!supabase) return safeInternalError(new Error('DB unavailable'), 'Upload failed');

  const timestamp = Date.now();
  const safeName = sanitize(file.name);
  const path = `applications/${timestamp}-${safeName}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    // Bucket may not exist yet — try creating it then retry
    if (uploadError.message?.includes('not found') || uploadError.message?.includes('does not exist')) {
      await supabase.storage.createBucket(BUCKET, { public: false });
      const { error: retryError } = await supabase.storage
        .from(BUCKET)
        .upload(path, buffer, { contentType: file.type, upsert: false });
      if (retryError) {
        logger.error('[upload/document] upload failed after bucket create', retryError);
        return safeInternalError(retryError, 'Upload failed');
      }
    } else {
      logger.error('[upload/document] upload failed', uploadError);
      return safeInternalError(uploadError, 'Upload failed');
    }
  }

  // Signed URL valid 30 days
  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 30);

  const url = signed?.signedUrl ?? path;

  return NextResponse.json({ success: true, url, path }, { status: 200 });
}
