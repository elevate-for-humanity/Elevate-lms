/**
 * POST /api/admin/dev-studio/upload
 *
 * Accepts a multipart file upload from the Dev Studio Documents tab.
 * Stores the file in Supabase Storage (documents bucket) under
 * devstudio/{userId}/{timestamp}-{filename}.
 *
 * Uses the private Supabase documents bucket and returns a short-lived signed URL.
 * Never writes to /tmp — files there are lost on container restart.
 *
 * Returns: { id, key, url, name, size, type, created_at }
 *
 * Admin-only. Max 50 MB.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_BYTES = 50 * 1024 * 1024;
const SUPABASE_BUCKET = 'documents';

async function extractAttachmentPreview(bytes: Uint8Array, contentType: string): Promise<string> {
  const buffer = Buffer.from(bytes);
  const mime = contentType.toLowerCase();
  try {
    if (
      mime.startsWith('text/') ||
      mime.includes('csv') ||
      mime.includes('json') ||
      mime.includes('markdown')
    ) {
      return buffer.toString('utf8').slice(0, 100_000);
    }
    if (mime.includes('pdf')) {
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: buffer });
      try {
        return (await parser.getText()).text.slice(0, 100_000);
      } finally {
        await parser.destroy();
      }
    }
    if (mime.includes('wordprocessingml') || mime.includes('msword')) {
      const mammoth = await import('mammoth');
      return (await mammoth.extractRawText({ buffer })).value.slice(0, 100_000);
    }
  } catch {
    return '';
  }
  return '';
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return safeError('Unauthorized', 401);

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const label = (formData.get('label') as string | null) ?? '';

    if (!file) return safeError('No file provided', 400);
    if (file.size > MAX_BYTES) {
      return safeError(`File exceeds ${Math.round(MAX_BYTES / (1024 * 1024))} MB limit`, 413);
    }

    const contentType = file.type || 'application/octet-stream';
    const ext =
      file.name
        .split('.')
        .pop()
        ?.toLowerCase()
        .replace(/[^a-z0-9]/g, '') || 'bin';
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
    const timestamp = Date.now();
    let key = `devstudio-docs/${user.id}/${timestamp}-${safeName}`;

    const bytes = new Uint8Array(await file.arrayBuffer());
    const contentPreview = await extractAttachmentPreview(bytes, contentType);
    const db = await requireAdminClient();
    const storagePath = `devstudio/${user.id}/${timestamp}-${safeName}`;
    const { error: uploadErr } = await db.storage
      .from(SUPABASE_BUCKET)
      .upload(storagePath, bytes, { contentType, upsert: false });

    if (uploadErr) return safeError('Storage upload failed', 500);

    const { data: signed, error: signedUrlError } = await db.storage
      .from(SUPABASE_BUCKET)
      .createSignedUrl(storagePath, 7 * 24 * 3600);

    if (signedUrlError || !signed?.signedUrl) {
      await db.storage.from(SUPABASE_BUCKET).remove([storagePath]);
      return safeError('File stored but a secure document URL could not be created', 500);
    }

    const signedUrl = signed.signedUrl;
    const storageBucket = SUPABASE_BUCKET;
    key = storagePath;
    const { data: doc, error: dbErr } = await db
      .from('devstudio_documents')
      .insert({
        user_id: user.id,
        name: label || file.name,
        original_name: file.name,
        s3_key: key,
        bucket: storageBucket,
        size_bytes: file.size,
        content_type: contentType,
        ext,
        signed_url: signedUrl,
        signed_url_expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        extracted_text: contentPreview || null,
        extraction_status: contentPreview ? 'complete' : 'unavailable',
      })
      .select('id, name, s3_key, size_bytes, content_type, extraction_status, created_at')
      .single();

    if (dbErr) {
      if (dbErr.code === '42P01') {
        return NextResponse.json({
          id: `temp-${timestamp}`,
          key,
          url: signedUrl,
          name: label || file.name,
          size: file.size,
          type: contentType,
          created_at: new Date().toISOString(),
          storage: storageBucket,
        });
      }
      return safeError('File uploaded but failed to record metadata', 500);
    }

    return NextResponse.json({
      ...doc,
      url: signedUrl,
      storage: storageBucket,
      content_preview: contentPreview,
    });
  } catch (err) {
    return safeInternalError(err, 'Upload failed');
  }
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return safeError('Unauthorized', 401);

  try {
    const db = await requireAdminClient();
    const { data, error } = await db
      .from('devstudio_documents')
      .select(
        'id, name, original_name, s3_key, size_bytes, content_type, ext, signed_url, signed_url_expires_at, created_at',
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ documents: [] });
      return safeError('Failed to fetch documents', 500);
    }

    return NextResponse.json({ documents: data ?? [] });
  } catch (err) {
    return safeInternalError(err, 'Failed to fetch documents');
  }
}
