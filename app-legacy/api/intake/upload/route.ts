// PUBLIC ROUTE: intake document upload — no auth required.
// Files are stored under intake-documents/{timestamp}-{random}/{filename}
// in the 'documents' bucket (private, admin-readable).
// Max 10 MB, PDF/JPEG/PNG/WebP only.

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg':      'jpg',
  'image/png':       'png',
  'image/webp':      'webp',
};

export async function POST(request: NextRequest) {
  // Stricter rate limit — 10 uploads per minute per IP
  const rateLimited = await applyRateLimit(request, 'contact');
  if (rateLimited) return rateLimited;

  const supabase = await requireAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');
  const docType = (formData.get('docType') as string | null) ?? 'other';

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'Only PDF, JPEG, PNG, and WebP files are accepted.' },
      { status: 415 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'File exceeds the 10 MB limit.' },
      { status: 413 },
    );
  }

  // Build a collision-resistant path: intake-documents/{ts}-{rand}/{docType}-{filename}
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const ext = EXT[file.type] ?? 'bin';
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
  const path = `intake-documents/${ts}-${rand}/${docType}-${safeName}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    logger.error('[intake/upload] Storage upload failed', uploadError, { path, docType });
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }

  // Return the storage path — the intake API stores this in document_urls.
  // Signed URLs are generated on demand by admin review pages.
  return NextResponse.json({ url: path }, { status: 200 });
}
