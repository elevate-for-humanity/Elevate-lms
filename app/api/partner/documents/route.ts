import { logger } from '@/lib/logger';
import { requireAdminClient } from '@/lib/supabase/admin';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import {
  mergeHostShopDocumentRequirements,
  resolveHostShopProgram,
} from '@/lib/partners/host-shop-onboarding';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

// GET - List partner's documents and requirements
async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get partner
    const { data: partnerUser } = await supabase
      .from('partner_users')
      .select('partner_id, partners(state, partner_type, program_type, programs)')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!partnerUser) {
      return NextResponse.json({ error: 'Not a partner' }, { status: 403 });
    }

    const partnerId = partnerUser.partner_id;
    const partner = (partnerUser.partners || {}) as Record<string, unknown>;
    const partnerState = (partner.state as string | undefined) || 'Indiana';
    const hostShopProgram = resolveHostShopProgram(partner);

    // Get partner's programs
    const { data: programAccess } = await supabase
      .from('partner_program_access')
      .select('program_id')
      .eq('partner_id', partnerId)
      .is('revoked_at', null);

    const programs = Array.from(
      new Set([hostShopProgram, ...(programAccess || []).map((p) => p.program_id).filter(Boolean)]),
    );

    // Get document requirements for this partner's state and programs. Always include
    // code defaults so host-shop dashboards still show required uploads when the
    // database seed rows are missing or only cover barber.
    const { data: dbRequirements } = await supabase
      .from('partner_document_requirements')
      .select('*')
      .in('state', [partnerState, 'ALL'])
      .in('program_id', [...programs, 'ALL']);

    const requirements = mergeHostShopDocumentRequirements(dbRequirements, hostShopProgram);

    // Get partner's uploaded documents
    const { data: documents } = await supabase
      .from('partner_documents')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });

    // Map requirements to documents
    const documentStatus = (requirements || []).map((req: any) => {
      const doc = (documents || []).find((d) => d.document_type === req.document_type);
      return {
        ...req,
        uploaded: !!doc,
        document: doc || null,
        status: doc?.status || 'missing',
      };
    });

    // Check if all required docs are complete
    const allComplete = documentStatus
      .filter((d: any) => d.is_required)
      .every((d: any) => d.status === 'accepted');

    return NextResponse.json({
      documents: documentStatus,
      allComplete,
      partnerId,
    });
  } catch (error) {
    logger.error('Documents GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Upload a document
async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const supabaseAdmin = await requireAdminClient();

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get partner
    const { data: partnerUser } = await supabase
      .from('partner_users')
      .select('partner_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!partnerUser) {
      return NextResponse.json({ error: 'Not a partner' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;
    const programId = (formData.get('programId') as string) || null;
    const expiresAt = (formData.get('expiresAt') as string) || null;

    if (!file || !documentType) {
      return NextResponse.json({ error: 'File and document type required' }, { status: 400 });
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum 10MB.' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. PDF, JPEG, or PNG only.' },
        { status: 400 },
      );
    }

    // Upload to Supabase Storage
    const fileName = `${partnerUser.partner_id}/${documentType}_${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('partner_documents')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      logger.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Get signed URL (bucket is private — public URL won't work)
    const { data: urlData } = await supabaseAdmin.storage
      .from('partner_documents')
      .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1-year expiry

    // Delete any existing document of this type
    await supabaseAdmin
      .from('partner_documents')
      .delete()
      .eq('partner_id', partnerUser.partner_id)
      .eq('document_type', documentType);

    // Create document record - AUTO-ACCEPT if file passes validation
    const { data: document, error: insertError } = await supabaseAdmin
      .from('partner_documents')
      .insert({
        partner_id: partnerUser.partner_id,
        document_type: documentType,
        program_id: programId,
        file_name: file.name,
        file_url: urlData?.signedUrl ?? uploadData.path,
        file_size: file.size,
        file_type: file.type,
        status: 'accepted', // Auto-accept on valid upload
        expires_at: expiresAt || null,
        reviewed_at: new Date().toISOString(), // System review
      })
      .select()
      .maybeSingle();

    if (insertError) {
      logger.error('Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save document' }, { status: 500 });
    }

    // Check if partner should be activated — non-fatal if RPC fails. The local
    // fallback uses the same host-shop defaults as the dashboard, so non-barber
    // host sites are not stuck when DB requirement seed rows are incomplete.
    let allDocsComplete = false;
    try {
      const { data: rpcResult } = await supabaseAdmin.rpc('check_partner_document_completion', {
        p_partner_id: partnerUser.partner_id,
      });
      allDocsComplete = !!rpcResult;
    } catch {
      // Non-fatal — document upload succeeded, local completion check follows.
    }

    if (!allDocsComplete) {
      const { data: partnerRow } = await supabaseAdmin
        .from('partners')
        .select('state, partner_type, program_type, programs')
        .eq('id', partnerUser.partner_id)
        .maybeSingle();
      const hostShopProgram = resolveHostShopProgram(partnerRow as Record<string, unknown> | null);
      const { data: programAccess } = await supabaseAdmin
        .from('partner_program_access')
        .select('program_id')
        .eq('partner_id', partnerUser.partner_id)
        .is('revoked_at', null);
      const programs = Array.from(
        new Set([hostShopProgram, ...(programAccess || []).map((p) => p.program_id).filter(Boolean)]),
      );
      const { data: dbRequirements } = await supabaseAdmin
        .from('partner_document_requirements')
        .select('*')
        .in('state', [(partnerRow as { state?: string } | null)?.state || 'Indiana', 'ALL'])
        .in('program_id', [...programs, 'ALL']);
      const requirements = mergeHostShopDocumentRequirements(dbRequirements, hostShopProgram);
      const { data: docsAfterUpload } = await supabaseAdmin
        .from('partner_documents')
        .select('document_type, status')
        .eq('partner_id', partnerUser.partner_id);
      const acceptedTypes = new Set(
        (docsAfterUpload || [])
          .filter((row: { status?: string }) => row.status === 'accepted')
          .map((row: { document_type?: string }) => row.document_type),
      );
      allDocsComplete = requirements
        .filter((req: any) => req.is_required)
        .every((req: any) => acceptedTypes.has(req.document_type));
    }

    if (allDocsComplete) {
      await supabaseAdmin
        .from('partners')
        .update({
          account_status: 'active',
          documents_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', partnerUser.partner_id);
    }

    return NextResponse.json({
      success: true,
      document,
      allDocsComplete,
    });
  } catch (error) {
    logger.error('Documents POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/partner/documents', _GET);
export const POST = withApiAudit('/api/partner/documents', _POST);
