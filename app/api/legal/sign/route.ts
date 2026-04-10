import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// All values must match rows in the agreement_versions table.
type AgreementType =
  | 'eula' | 'tos' | 'aup' | 'disclosures' | 'license' | 'nda'
  | 'mou' | 'employer_agreement' | 'staff_agreement' | 'program_holder_mou'
  | 'enrollment' | 'handbook' | 'data_sharing' | 'ferpa' | 'participation';
type SignatureMethod = 'checkbox' | 'typed' | 'drawn';

interface SignRequest {
  agreements: AgreementType[];
  signer_name: string;
  signer_email: string;
  signer_title?: string;
  signature_method: SignatureMethod;
  signature_typed?: string;
  signature_data?: string; // Base64 encoded drawn signature
  context: 'checkout' | 'first_login' | 'upgrade' | 'renewal' | 'onboarding';
  organization_id?: string;
  stripe_session_id?: string;
}

/**
 * POST /api/legal/sign
 * Records digitally signed agreement acceptances with signature data
 */
async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: SignRequest = await request.json();
    const {
      agreements,
      signer_name,
      signer_email,
      signer_title,
      signature_method,
      signature_typed,
      signature_data,
      context,
      organization_id,
      stripe_session_id,
    } = body;

    // Validation
    if (!agreements || !Array.isArray(agreements) || agreements.length === 0) {
      return NextResponse.json({ error: 'agreements array required' }, { status: 400 });
    }

    if (!signer_name || signer_name.trim().length < 2) {
      return NextResponse.json({ error: 'signer_name required (min 2 characters)' }, { status: 400 });
    }

    if (!signer_email || !signer_email.includes('@')) {
      return NextResponse.json({ error: 'valid signer_email required' }, { status: 400 });
    }

    if (!signature_method || !['checkbox', 'typed', 'drawn'].includes(signature_method)) {
      return NextResponse.json({ error: 'valid signature_method required' }, { status: 400 });
    }

    if (signature_method === 'typed' && (!signature_typed || signature_typed.trim().length < 2)) {
      return NextResponse.json({ error: 'typed signature required' }, { status: 400 });
    }

    if (signature_method === 'drawn' && !signature_data) {
      return NextResponse.json({ error: 'drawn signature data required' }, { status: 400 });
    }

    // Get request metadata
    const headersList = await headers();
    const ip_address = headersList.get('x-forwarded-for')?.split(',')[0] ||
                       headersList.get('x-real-ip') ||
                       'unknown';
    const user_agent = headersList.get('user-agent') || 'unknown';

    // Get current versions for each agreement type
    const { data: versions, error: versionsError } = await supabase
      .from('agreement_versions')
      .select('agreement_type, current_version, document_url')
      .in('agreement_type', agreements);

    if (versionsError) {
      logger.error('Error fetching agreement versions:', versionsError);
      // Continue with default version if table doesn't exist yet
    }

    const timestamp = new Date().toISOString();

    // Get user profile for role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = profile?.role || 'student';

    // Create acceptance records with signature data
    // Note: Only include columns that exist in the table
    const acceptances = agreements.map(agreementType => {
      const version = versions?.find(v => v.agreement_type === agreementType);
      return {
        user_id: user.id,
        organization_id: organization_id || null,
        agreement_type: agreementType,
        document_version: version?.current_version || '1.0',
        // Signature fields
        signer_name: signer_name.trim(),
        signer_email: signer_email.trim().toLowerCase(),
        signature_method,
        signature_data: signature_method === 'drawn' ? signature_data : (signature_method === 'typed' ? signature_typed?.trim() : null),
        // Metadata
        accepted_at: timestamp,
        ip_address,
        user_agent,
        legal_acknowledgment: true,
        role_at_signing: userRole,
      };
    });

    // Insert acceptances (upsert to handle re-signing)
    const { data: inserted, error: insertError } = await supabase
      .from('license_agreement_acceptances')
      .upsert(acceptances, {
        onConflict: 'user_id,agreement_type,document_version',
      })
      .select();

    if (insertError) {
      logger.error('Error recording signed agreements:', insertError);
      return NextResponse.json({ error: 'Failed to record signature' }, { status: 500 });
    }

    // Log the signing event for audit trail
    try {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'agreement_signed',
        resource_type: 'license_agreement_acceptances',
        resource_id: inserted?.[0]?.id || null,
        metadata: {
          agreements_signed: agreements,
          signer_name,
          signer_email,
          signature_method,
          context,
          organization_id,
          ip_address,
          timestamp,
        },
      });
    } catch (auditError) {
      // Don't fail the request if audit logging fails
      logger.error('Audit log error:', auditError);
    }

    return NextResponse.json({
      success: true,
      signed: agreements,
      signer: {
        name: signer_name,
        email: signer_email,
        title: signer_title || null,
      },
      signature_method,
      timestamp,
      ip_address,
      message: `Successfully signed ${agreements.length} agreement(s)`,
    });

  } catch (error) {
    logger.error('Agreement signing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/legal/sign', _POST);
