// Batch document upload for ComprehensiveEnrollmentWizard.
// Accepts multipart/form-data with one or more file fields.
// Each field name becomes the documentType. Returns { documentUrls } map.
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const documentUrls: Record<string, string> = {};

    for (const [fieldName, value] of formData.entries()) {
      if (!(value instanceof File) || value.size === 0) continue;

      const file = value;
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/wizard/${fieldName}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        logger.error('Batch upload error:', { field: fieldName, error: uploadError });
        continue; // skip failed files, don't abort the whole batch
      }

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      documentUrls[fieldName] = urlData.publicUrl;

      // Record in documents table (non-blocking)
      supabase
        .from('documents')
        .insert({
          user_id: user.id,
          file_name: file.name,
          document_type: fieldName,
          file_url: urlData.publicUrl,
          file_path: fileName,
          file_size: file.size,
          mime_type: file.type,
          status: 'pending_review',
        })
        .then(({ error }) => {
          if (error) logger.error('Document record error:', error);
        });
    }

    return NextResponse.json({ documentUrls });
  } catch (error) {
    logger.error('Batch document upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/enrollment/upload-documents', _POST);
