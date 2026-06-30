/**
 * POST /api/partners/upload-document
 *
 * Authenticated partner document upload used by esthetician and nail tech
 * onboarding forms. Accepts `file`, `slotId`, and `program` from FormData,
 * maps them to the canonical partner_documents schema, and stores in the
 * partner_documents Supabase Storage bucket.
 *
 * Auth: session cookie — partner must be logged in.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return safeError('Unauthorized', 401);

    const supabaseAdmin = await requireAdminClient();
    if (!supabaseAdmin) return safeError('Service temporarily unavailable', 503);

    // Resolve partner_id from session user
    const { data: partnerUser } = await supabase
      .from('partner_users')
      .select('partner_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!partnerUser?.partner_id) {
      return safeError('Not a partner account', 403);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    // Forms send slotId (e.g. "ein_letter") — map to documentType
    const slotId = (formData.get('slotId') as string | null) ?? (formData.get('documentType') as string | null);
    const program = (formData.get('program') as string | null) ?? null;

    if (!file || !slotId) {
      return safeError('file and slotId are required', 400);
    }

    if (file.size > MAX_SIZE) {
      return safeError('File too large. Maximum 10 MB.', 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return safeError('Invalid file type. PDF, JPEG, PNG, or WebP only.', 400);
    }

    const ext = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '') ?? 'bin';
    const storagePath = `${partnerUser.partner_id}/${slotId}-${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from('partner_documents')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      logger.error('[upload-document] storage upload failed', uploadError);
      return safeInternalError(uploadError, 'Storage upload failed');
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('partner_documents')
      .getPublicUrl(storagePath);

    // Upsert document record — replace any prior upload for this slot
    await supabaseAdmin
      .from('partner_documents')
      .delete()
      .eq('partner_id', partnerUser.partner_id)
      .eq('document_type', slotId);

    await supabaseAdmin
      .from('partner_documents')
      .insert({
        partner_id: partnerUser.partner_id,
        document_type: slotId,
        program_id: program,
        file_name: file.name,
        file_url: urlData?.publicUrl ?? null,
        file_size: file.size,
        file_type: file.type,
        storage_path: storagePath,
        status: 'pending',
      })
      .then(() => {})
      .catch(() => {}); // non-fatal — storage upload already succeeded

    return NextResponse.json({ success: true, path: storagePath });
  } catch (err) {
    logger.error('[upload-document] unexpected error', err);
    return safeInternalError(err, 'Upload failed');
  }
}
