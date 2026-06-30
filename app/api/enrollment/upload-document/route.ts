import { internalFetch } from '@/lib/api/internal-fetch';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { ensureDigitalBinder } from '@/lib/enrollment/ensure-digital-binder';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;
    const enrollmentId = formData.get('enrollmentId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!enrollmentId) {
      return NextResponse.json({ error: 'enrollmentId is required' }, { status: 400 });
    }

    // Verify enrollment belongs to this user
    const { data: enrollment } = await supabase
      .from('program_enrollments')
      .select('id')
      .eq('id', enrollmentId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Ensure a digital binder exists for this enrollment (idempotent)
    const { binderId } = await ensureDigitalBinder({
      db: supabase as any,
      userId: user.id,
      enrollmentId: enrollment.id,
    });

    // No file size or type restrictions — accept any file
    const fileExt = file.name.split('.').pop()?.toLowerCase() ?? '';
    const normalizedExt = fileExt || 'bin';

    // Generate unique filename
    const fileName = `${user.id}/${enrollmentId}/${documentType}-${Date.now()}.${normalizedExt}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      logger.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // documents bucket is private — signed URL for immediate UI feedback; persist file_path only.
    const { data: signed, error: signError } = await supabase.storage
      .from('documents')
      .createSignedUrl(fileName, 3600);
    if (signError) {
      logger.error('Signed URL error:', signError);
      return NextResponse.json({ error: 'Failed to secure uploaded file' }, { status: 500 });
    }

    // Create document record — linked to enrollment and binder
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        enrollment_id: enrollmentId,
        file_name: file.name,
        document_type: documentType,
        file_url: signed.signedUrl,
        file_path: fileName,
        file_size: file.size,
        mime_type: file.type,
        status: 'pending_review',
        metadata: { digital_binder_id: binderId },
      })
      .select()
      .maybeSingle();

    if (dbError) {
      logger.error('Database error:', dbError);
      // Don't fail — file is uploaded, just log the error
    }

    // OCR — save directly for image uploads, fire-and-forget for others
    if (document?.id) {
      if (file.type.startsWith('image/')) {
        try {
          const siteUrl =
            process.env.NEXT_PUBLIC_SITE_URL ||
            process.env.URL ||
            process.env.NEXTAUTH_URL ||
            '';
          if (siteUrl) {
            const ocrForm = new FormData();
            ocrForm.append('file', file);
            ocrForm.append('documentType', documentType);
            ocrForm.append('programContext', 'learner');

            const ocrRes = await internalFetch(`${siteUrl}/api/ocr/extract`, {
              method: 'POST',
              body: ocrForm,
            });

            if (ocrRes.ok) {
              const ocrData = await ocrRes.json();
              await supabase
                .from('documents')
                .update({ ocr_text: ocrData.rawText || null })
                .eq('id', document.id);
            }
          }
        } catch (err) {
          logger.warn('OCR extraction/update failed (non-fatal)', err as Error);
        }
      } else {
        // Non-image: async automation trigger (fire-and-forget)
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXTAUTH_URL ?? '';
        if (baseUrl) {
          fetch(`${baseUrl}/api/automation/process-document`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-internal-trigger': '1' },
            body: JSON.stringify({ document_id: document.id }),
          }).catch((err) => logger.warn('OCR trigger failed (non-fatal)', err));
        }
      }
    }

    return NextResponse.json({
      success: true,
      document: document || { file_url: signed.signedUrl, file_path: fileName },
      path: fileName,
    });
  } catch (error) {
    logger.error('Document upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/enrollment/upload-document', _POST);
