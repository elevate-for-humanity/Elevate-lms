/**
 * POST /api/upload   — admin document upload to Supabase Storage + documents table
 * DELETE /api/upload?path=<file_path> — remove from storage + documents table
 *
 * Accepts multipart/form-data with:
 *   file     — the file blob
 *   category — storage subfolder (defaults to "admin-documents")
 *
 * Returns: { url: string, path: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { createAdminClient } from '@/lib/supabase/admin';
import { safeError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'documents';
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]);

export async function POST(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File exceeds 10 MB limit' }, { status: 400 });
  }

  const category = (formData.get('category') as string | null) ?? 'admin-documents';
  // Sanitise category — only allow slug-safe characters
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() ?? 'bin';
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${category}/${Date.now()}-${safeName}`;

  const db = await createAdminClient();

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await db.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json(safeError(uploadError), { status: 500 });
  }

  const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(path);

  // Optional fields from form data
  const application_id = (formData.get('application_id') as string | null) ?? null;
  const user_id        = (formData.get('user_id')        as string | null) ?? null;

  // Record in documents table
  const { data: docRow, error: insertError } = await db
    .from('documents')
    .insert({
      file_name: file.name,
      file_path: path,
      file_url: urlData.publicUrl,
      mime_type: file.type,
      file_size_bytes: file.size,
      document_type: category,
      status: 'active',
      uploaded_by: auth.id,
      ...(application_id ? { application_id } : {}),
      ...(user_id        ? { user_id }        : {}),
    })
    .select('id')
    .single();

  if (insertError) {
    // Storage upload succeeded — log but don't fail the request
    console.error('[upload] documents insert failed:', insertError.message);
  }

  // Trigger OCR extraction asynchronously — fire-and-forget
  // The extract route saves results back to the documents row and auto-applies
  // fields to the linked application if application_id is set.
  if (docRow?.id) {
    const baseUrl = request.nextUrl.origin;
    fetch(`${baseUrl}/api/admin/documents/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward auth cookie so the extract route can verify admin session
        cookie: request.headers.get('cookie') ?? '',
      },
      body: JSON.stringify({ document_id: docRow.id }),
    }).catch(() => { /* non-fatal — extraction can be retried manually */ });
  }

  return NextResponse.json({
    url: urlData.publicUrl,
    path,
    document_id: docRow?.id ?? null,
    ocr_triggered: !!docRow?.id,
  });
}

export async function DELETE(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;

  const filePath = new URL(request.url).searchParams.get('path');
  if (!filePath) {
    return NextResponse.json({ error: 'path is required' }, { status: 400 });
  }

  const db = await createAdminClient();

  const { error: storageError } = await db.storage.from(BUCKET).remove([filePath]);
  if (storageError) {
    return NextResponse.json(safeError(storageError), { status: 500 });
  }

  await db.from('documents').delete().eq('file_path', filePath);

  return NextResponse.json({ success: true });
}
