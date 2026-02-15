import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// GET - List partner's documents and requirements
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get partner
    const { data: partnerUser } = await supabase
      .from('partner_users')
      .select('partner_id, partners(state)')
      .eq('user_id', user.id)
      .single();

    if (!partnerUser) {
      return NextResponse.json({ error: 'Not a partner' }, { status: 403 });
    }

    const partnerId = partnerUser.partner_id;
    const partnerState = (partnerUser.partners as { state: string })?.state || 'Indiana';

    // Get partner's programs
    const { data: programAccess } = await supabase
      .from('partner_program_access')
      .select('program_id')
      .eq('partner_id', partnerId)
      .is('revoked_at', null);

    const programs = (programAccess || []).map(p => p.program_id);

    // Get document requirements for this partner's state and programs
    const { data: requirements } = await supabase
      .from('partner_document_requirements')
      .select('*')
      .or(`state.eq.${partnerState},state.eq.ALL`)
      .or(`program_id.in.(${programs.join(',')}),program_id.eq.ALL`);

    // Get partner's uploaded documents
    const { data: documents } = await supabase
      .from('partner_documents')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });

    // Map requirements to documents
    const documentStatus = (requirements || []).map(req => {
      const doc = (documents || []).find(d => d.document_type === req.document_type);
      return {
        ...req,
        uploaded: !!doc,
        document: doc || null,
        status: doc?.status || 'missing',
      };
    });

    // Check if all required docs are complete
    const allComplete = documentStatus
      .filter(d => d.is_required)
      .every(d => d.status === 'accepted');

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
export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get partner
    const { data: partnerUser } = await supabase
      .from('partner_users')
      .select('partner_id')
      .eq('user_id', user.id)
      .single();

    if (!partnerUser) {
      return NextResponse.json({ error: 'Not a partner' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;
    const programId = formData.get('programId') as string || null;
    const expiresAt = formData.get('expiresAt') as string || null;

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
      return NextResponse.json({ error: 'Invalid file type. PDF, JPEG, or PNG only.' }, { status: 400 });
    }

    // Upload to Supabase Storage
    const fileName = `${partnerUser.partner_id}/${documentType}_${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('partner-documents')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      logger.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('partner-documents')
      .getPublicUrl(fileName);

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
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type,
        status: 'accepted', // Auto-accept on valid upload
        expires_at: expiresAt || null,
        reviewed_at: new Date().toISOString(), // System review
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save document' }, { status: 500 });
    }

    // Check if partner should be activated
    const { data: allDocsComplete } = await supabaseAdmin.rpc('check_partner_document_completion', {
      p_partner_id: partnerUser.partner_id,
    });

    if (allDocsComplete) {
      // Activate partner
      await supabaseAdmin
        .from('partners')
        .update({ account_status: 'active', updated_at: new Date().toISOString() })
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
