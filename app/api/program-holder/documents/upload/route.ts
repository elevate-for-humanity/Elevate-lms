import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a program holder
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'program_holder') {
      return NextResponse.json(
        { error: 'Must be a program holder to upload documents' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('document_type') as string;
    const description = formData.get('description') as string | null;

    if (!file || !documentType) {
      return NextResponse.json(
        { error: 'Missing required fields: file and document_type' },
        { status: 400 }
      );
    }

    // Validate document type
    const validTypes = [
      'syllabus',
      'license',
      'insurance',
      'accreditation',
      'instructor_credentials',
      'facility_photos',
      'mou',
      'other',
    ];

    if (!validTypes.includes(documentType)) {
      return NextResponse.json(
        {
          error: `Invalid document_type. Must be one of: ${validTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Get file extension
    const fileExt = file.name.split('.').pop();
    const fileName = file.name;

    // Upload to storage with organized path
    const path = `${user.id}/${documentType}/${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('program_holder_documents')
      .upload(path, file, {
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: 'Upload failed' },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage
      .from('program_holder_documents')
      .getPublicUrl(uploadData.path);

    // Save document record to database
    const { data: document, error: dbError } = await supabase
      .from('program_holder_documents')
      .insert({
        user_id: user.id,
        organization_id: profile.organization_id,
        document_type: documentType,
        file_name: fileName,
        file_url: uploadData.path,
        file_size: file.size,
        mime_type: file.type,
        description: description || null,
        uploaded_by: user.id,
        approved: null, // null = pending review; false = rejected; true = approved
      })
      .select()
      .single();

    if (dbError) {
      // Clean up uploaded file
      await supabase.storage
        .from('program_holder_documents')
        .remove([uploadData.path]);

      return NextResponse.json(
        { error: 'Database operation failed' },
        { status: 500 }
      );
    }

    // Run OCR validation for image files — non-fatal, routes to manual review on failure
    if (file.type.startsWith('image/')) {
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || '';
        const ocrFormData = new FormData();
        ocrFormData.append('file', file);
        ocrFormData.append('documentType', documentType);
        ocrFormData.append('programContext', 'program_holder');

        const ocrRes = await fetch(`${siteUrl}/api/ocr/extract`, {
          method: 'POST',
          body: ocrFormData,
        });

        if (ocrRes.ok) {
          const ocrData = await ocrRes.json();
          // Update document record with OCR result
          await supabase
            .from('program_holder_documents')
            .update({ ocr_text: ocrData.rawText || null })
            .eq('id', document.id)
            .catch(() => {}); // column may not exist yet — ignore
          logger.info('[PH Upload] OCR complete', { documentId: document.id, documentType });
        }
      } catch (ocrErr) {
        logger.warn('[PH Upload] OCR failed — document will be manually reviewed', ocrErr);
      }
    }

    // Notify admin of new document upload
    try {
      const admin = await getAdminClient();
      const { data: phProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      const sgKey = process.env.SENDGRID_API_KEY;
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
      if (sgKey && phProfile) {
        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: { Authorization: `Bearer ${sgKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: { email: 'noreply@elevateforhumanity.org', name: 'Elevate for Humanity' },
            reply_to: { email: 'elevate4humanityedu@gmail.com', name: 'Elevate for Humanity' },
            personalizations: [{ to: [{ email: 'elevate4humanityedu@gmail.com' }] }],
            subject: `Document Uploaded — ${phProfile.full_name || 'Program Holder'} (${documentType.replace(/_/g, ' ')})`,
            content: [{
              type: 'text/html',
              value: `<p><strong>${phProfile.full_name || 'A program holder'}</strong> (${phProfile.email}) uploaded a new document.</p>
<p><strong>Type:</strong> ${documentType.replace(/_/g, ' ')}<br>
<strong>File:</strong> ${fileName}<br>
<strong>Size:</strong> ${(file.size / 1024).toFixed(0)} KB</p>
<p><a href="${siteUrl}/admin/dashboard">Review in Admin Dashboard →</a></p>`,
            }],
          }),
        }).catch(() => {});
      }
    } catch {
      // Non-fatal — don't block upload response
    }

    // Check if all onboarding steps are now complete and fire welcome email
    try {
      const admin = await getAdminClient();
      if (admin) {
        const { data: holder } = await admin
          .from('program_holders')
          .select('mou_signed, welcome_email_sent, organization_name')
          .eq('user_id', user.id)
          .maybeSingle();

        if (holder?.mou_signed && !holder?.welcome_email_sent) {
          const { data: acks } = await admin
            .from('program_holder_acknowledgements')
            .select('document_type')
            .eq('user_id', user.id);

          const hasHandbook = acks?.some((a: any) => a.document_type === 'handbook');
          const hasRights = acks?.some((a: any) => a.document_type === 'rights');

          if (hasHandbook && hasRights) {
            // All steps done — send full welcome email inline
            const { checkAndSendOnboardingCompleteEmail } = await import('@/lib/program-holder/onboarding-complete');
            await checkAndSendOnboardingCompleteEmail(admin, user.id).catch((err: unknown) => {
              logger.warn('[PH Upload] onboarding-complete email failed', err);
            });
          }
        }
      }
    } catch {
      // Non-fatal
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        document_type: document.document_type,
        file_name: document.file_name,
        file_url: publicUrl,
        approved: document.approved,
        created_at: document.created_at,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: toErrorMessage(err) || 'Upload failed' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/program-holder/documents/upload', _POST);
