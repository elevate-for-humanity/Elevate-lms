/**
 * POST /api/devstudio/upload
 *
 * Accepts a multipart file upload from the Dev Studio Documents tab.
 * Stores the file in Supabase Storage (documents bucket) under
 * devstudio/{userId}/{timestamp}-{filename}.
 *
 * Falls back to R2 only when R2_ENDPOINT and R2_BUCKET are explicitly set.
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
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB
const SUPABASE_BUCKET = 'documents'; // always-available Supabase Storage bucket

function hasR2Config(): boolean {
  // Only use R2 when explicitly configured with R2-specific vars.
  return Boolean(process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY && process.env.R2_BUCKET);
}

function getS3(): S3Client {
  return new S3Client({
    endpoint: process.env.R2_ENDPOINT!,
    region:   process.env.R2_REGION || 'auto',
    credentials: {
      accessKeyId:     process.env.R2_ACCESS_KEY!,
      secretAccessKey: process.env.R2_SECRET_KEY!,
    },
    forcePathStyle: true,
  });
}

const R2_BUCKET = process.env.R2_BUCKET || '';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  // Get current user id for path namespacing
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
    const ext       = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
    const safeName  = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
    const timestamp = Date.now();
    const key       = `devstudio-docs/${user.id}/${timestamp}-${safeName}`;

    const bytes = new Uint8Array(await file.arrayBuffer());
    let signedUrl = '';
    let storageBucket = SUPABASE_BUCKET;

    if (hasR2Config()) {
      // R2/S3 explicitly configured — use it
      const s3 = getS3();
      await s3.send(new PutObjectCommand({
        Bucket:      R2_BUCKET,
        Key:         key,
        Body:        bytes,
        ContentType: contentType,
        Metadata:    { 'uploaded-by': user.id, 'original-name': file.name, label },
      }));
      signedUrl = await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
        { expiresIn: 7 * 24 * 3600 },
      );
      storageBucket = R2_BUCKET;
    } else {
      // Default: Supabase Storage — always available, survives container restarts
      const db = await requireAdminClient();
      const storagePath = `devstudio/${user.id}/${timestamp}-${safeName}`;
      const { error: uploadErr } = await db.storage
        .from(SUPABASE_BUCKET)
        .upload(storagePath, bytes, { contentType, upsert: false });

      if (uploadErr) {
        return safeError(`Storage upload failed: ${uploadErr.message}`, 500);
      }

      const { data: urlData } = db.storage
        .from(SUPABASE_BUCKET)
        .getPublicUrl(storagePath);

      // Use signed URL for private bucket
      const { data: signed, error: signErr } = await db.storage
        .from(SUPABASE_BUCKET)
        .createSignedUrl(storagePath, 7 * 24 * 3600);

      signedUrl = signed?.signedUrl ?? urlData?.publicUrl ?? '';
      // Reassign key to match actual Supabase storage path
      key = storagePath;
    }

    // Record in DB
    const db = await requireAdminClient();
    const { data: doc, error: dbErr } = await db
      .from('devstudio_documents')
      .insert({
        user_id:      user.id,
        name:         label || file.name,
        original_name: file.name,
        s3_key:       key,
        bucket:       storageBucket,
        size_bytes:   file.size,
        content_type: contentType,
        ext,
        signed_url:   signedUrl,
        signed_url_expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      })
      .select('id, name, s3_key, size_bytes, content_type, created_at')
      .single();

    if (dbErr) {
      // Table may not exist yet — still return success with the storage URL
      if (dbErr.code === '42P01') {
        return NextResponse.json({
          id: `temp-${timestamp}`, key, url: signedUrl,
          name: label || file.name, size: file.size, type: contentType,
          created_at: new Date().toISOString(), storage: storageBucket,
        });
      }
      return safeError('File uploaded but failed to record metadata', 500);
    }

    return NextResponse.json({ ...doc, url: signedUrl, storage: storageBucket });
  } catch (err) {
    return safeInternalError(err, 'Upload failed');
  }
}

// ── GET — list documents for current user ─────────────────────────────────────

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return safeError('Unauthorized', 401);

  try {
    const db = await requireAdminClient();
    const { data, error } = await db
      .from('devstudio_documents')
      .select('id, name, original_name, s3_key, size_bytes, content_type, ext, signed_url, signed_url_expires_at, created_at')
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
