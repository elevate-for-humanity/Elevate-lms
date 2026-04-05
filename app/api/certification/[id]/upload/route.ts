// POST /api/certification/[id]/upload
//
// Student uploads their exam result certificate (PDF or image).
// File is stored in Supabase Storage bucket 'credential-uploads'.
// Path: {user_id}/{certification_request_id}/{filename}
//
// Advances status: awaiting_upload → upload_pending

import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { createAdminClient } from '@/lib/supabase/admin';
import { recordUpload } from '@/lib/services/exam-authorization';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return safeError('file required', 400);
    if (!ALLOWED_TYPES.includes(file.type)) return safeError('Only PDF, JPEG, PNG, or WebP allowed', 400);
    if (file.size > MAX_BYTES) return safeError('File must be under 10 MB', 400);

    const db = createAdminClient();
    if (!db) return safeError('Storage unavailable', 503);

    // Sanitize filename
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'pdf';
    const safeName = `exam-result-${Date.now()}.${ext}`;
    const storagePath = `${auth.user.id}/${params.id}/${safeName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadErr } = await db.storage
      .from('credential_uploads')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadErr) {
      return safeError('File upload failed — try again', 500);
    }

    const result = await recordUpload(params.id, auth.user.id, storagePath, file.name);
    if (!result.ok) return safeError(result.error ?? 'Failed to record upload', 400);

    return NextResponse.json({ success: true, uploadId: result.uploadId }, { status: 201 });
  } catch (err) {
    return safeInternalError(err, 'Upload failed');
  }
}
