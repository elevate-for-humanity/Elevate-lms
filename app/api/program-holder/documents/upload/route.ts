import { safeInternalError } from '@/lib/api/safe-error';
import { internalFetch } from '@/lib/api/internal-fetch';
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import {
  isProgramHolderUploadDocumentType,
  programHolderDocumentStatus,
} from '@/lib/program-holder/document-requirements';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { logger } from '@/lib/logger';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || profile.role !== 'program_holder') {
      return NextResponse.json(
        { error: 'Must be a program holder to upload documents' },
        { status: 403 },
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('document_type') as string;
    const description = formData.get('description') as string | null;

    if (!file || !documentType) {
      return NextResponse.json(
        { error: 'Missing required fields: file and document_type' },
        { status: 400 },
      );
    }

    if (!isProgramHolderUploadDocumentType(documentType)) {
      return NextResponse.json({ error: 'Invalid document_type' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop();
    const fileName = file.name;
    const path = `${user.id}/${documentType}/${Date.now()}.${fileExt}`;

    const adminDb = await getAdminClient();
    const storageClient = adminDb ?? supabase;
    const dbClient = adminDb ?? supabase;

    const { data: uploadData, error: uploadError } = await storageClient.storage
      .from('program_holder_documents')
      .upload(path, file, {
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      logger.warn('[PH Upload] storage upload failed', uploadError);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    const { data: signedForAccess } = await storageClient.storage
      .from('program_holder_documents')
      .createSignedUrl(uploadData.path, 3600);
    const fileAccessUrl = signedForAccess?.signedUrl ?? uploadData.path;

    const { data: document, error: dbError } = await dbClient
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
        approved: null,
        status: 'pending',
      })
      .select()
      .maybeSingle();

    if (dbError || !document) {
      await storageClient.storage.from('program_holder_documents').remove([uploadData.path]);
      return NextResponse.json({ error: 'Database operation failed' }, { status: 500 });
    }

    if (documentType === 'hvac_license') {
      try {
        const { data: phLink } = await dbClient
          .from('profiles')
          .select('program_holder_id')
          .eq('id', user.id)
          .maybeSingle();
        const holderId = phLink?.program_holder_id;
        if (holderId) {
          await dbClient
            .from('program_holders')
            .update({
              hvac_license_url: fileAccessUrl,
              hvac_license_uploaded_at: new Date().toISOString(),
            })
            .eq('id', holderId);
        }
      } catch {
        // non-fatal
      }
    }

    if (file.type.startsWith('image/')) {
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || '';
        const ocrFormData = new FormData();
        ocrFormData.append('file', file);
        ocrFormData.append('documentType', documentType);
        ocrFormData.append('programContext', 'program_holder');

        const ocrRes = await internalFetch(`${siteUrl}/api/ocr/extract`, {
          method: 'POST',
          body: ocrFormData,
        });

        if (ocrRes.ok) {
          const ocrData = await ocrRes.json();
          await dbClient
            .from('program_holder_documents')
            .update({ ocr_text: ocrData.rawText || null })
            .eq('id', document.id)
            .then(
              () => {},
              () => {},
            );
          logger.info('[PH Upload] OCR complete', { documentId: document.id, documentType });
        }
      } catch (ocrErr) {
        logger.warn('[PH Upload] OCR failed — document will be manually reviewed', ocrErr);
      }
    }

    try {
      const { data: phProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .maybeSingle();

      const sgKey = process.env.SENDGRID_API_KEY;
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
      if (sgKey && phProfile) {
        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: { Authorization: `Bearer ${sgKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: { email: PLATFORM_DEFAULTS.emailFromAddress, name: PLATFORM_DEFAULTS.orgName },
            reply_to: { email: 'elevate4humanityedu@gmail.com', name: PLATFORM_DEFAULTS.orgName },
            personalizations: [{ to: [{ email: 'elevate4humanityedu@gmail.com' }] }],
            subject: `Document Uploaded — ${phProfile.full_name || 'Program Holder'} (${documentType.replace(/_/g, ' ')})`,
            content: [
              {
                type: 'text/html',
                value: `<p><strong>${phProfile.full_name || 'A program holder'}</strong> (${phProfile.email}) uploaded a new document.</p>
<p><strong>Type:</strong> ${documentType.replace(/_/g, ' ')}<br>
<strong>File:</strong> ${fileName}<br>
<strong>Size:</strong> ${(file.size / 1024).toFixed(0)} KB</p>
<p><a href="${siteUrl}/admin/program-holder-documents">Review program holder documents →</a></p>`,
              },
            ],
          }),
        }).then(
          () => {},
          () => {},
        );
      }
    } catch {
      // Non-fatal
    }

    try {
      const admin = await getAdminClient();
      if (admin) {
        const { data: profileLink } = await admin
          .from('profiles')
          .select('program_holder_id')
          .eq('id', user.id)
          .maybeSingle();

        let holderId: string | null = profileLink?.program_holder_id ?? null;
        if (!holderId) {
          const { data: legacyHolder } = await admin
            .from('program_holders')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          holderId = legacyHolder?.id ?? null;
        }

        const { data: holder } = holderId
          ? await admin
              .from('program_holders')
              .select('mou_signed, welcome_email_sent, organization_name')
              .eq('id', holderId)
              .maybeSingle()
          : { data: null as { mou_signed?: boolean; welcome_email_sent?: boolean } | null };

        if (holder?.mou_signed && !holder?.welcome_email_sent) {
          const { data: acks } = await admin
            .from('program_holder_acknowledgements')
            .select('document_type')
            .eq('user_id', user.id);

          const hasHandbook = acks?.some((a: { document_type: string }) => a.document_type === 'handbook');
          const hasRights = acks?.some((a: { document_type: string }) => a.document_type === 'rights');

          if (hasHandbook && hasRights) {
            const { checkAndSendOnboardingCompleteEmail } =
              await import('@/lib/program-holder/onboarding-complete');
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
        file_url: fileAccessUrl,
        status: programHolderDocumentStatus(document),
        approved: document.approved,
        created_at: document.created_at,
      },
    });
  } catch (err: unknown) {
    return safeInternalError(err as Error, 'Upload failed');
  }
}

export const POST = withApiAudit('/api/program-holder/documents/upload', _POST);
