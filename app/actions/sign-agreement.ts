'use server';

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { logger } from '@/lib/logger';

type AgreementType =
  | 'eula' | 'tos' | 'aup' | 'disclosures' | 'license' | 'nda'
  | 'mou' | 'employer_agreement' | 'staff_agreement' | 'program_holder_mou'
  | 'enrollment' | 'handbook' | 'data_sharing' | 'ferpa' | 'participation';

type SignatureMethod = 'checkbox' | 'typed' | 'drawn';

interface SignParams {
  agreementType: AgreementType;
  signerName: string;
  signerEmail: string;
  signatureMethod: SignatureMethod;
  signatureTyped?: string;
  signatureData?: string;
  context: 'checkout' | 'first_login' | 'upgrade' | 'renewal' | 'onboarding';
  organizationId?: string;
}

export async function signAgreement(params: SignParams): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const {
    agreementType,
    signerName,
    signerEmail,
    signatureMethod,
    signatureTyped,
    signatureData,
    context,
    organizationId,
  } = params;

  if (!signerName || signerName.trim().length < 2) {
    return { error: 'signer_name required (min 2 characters)' };
  }
  if (!signerEmail || !signerEmail.includes('@')) {
    return { error: 'valid signer_email required' };
  }
  if (signatureMethod === 'typed' && (!signatureTyped || signatureTyped.trim().length < 2)) {
    return { error: 'typed signature required' };
  }
  if (signatureMethod === 'drawn' && !signatureData) {
    return { error: 'drawn signature data required' };
  }

  const headersList = await headers();
  const ip_address =
    headersList.get('x-forwarded-for')?.split(',')[0] ||
    headersList.get('x-real-ip') ||
    'unknown';
  const user_agent = headersList.get('user-agent') || 'unknown';

  const { data: versions } = await supabase
    .from('agreement_versions')
    .select('agreement_type, current_version')
    .eq('agreement_type', agreementType)
    .maybeSingle();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const timestamp = new Date().toISOString();

  const { error: insertError } = await supabase
    .from('license_agreement_acceptances')
    .upsert(
      {
        user_id: user.id,
        organization_id: organizationId || null,
        agreement_type: agreementType,
        document_version: versions?.current_version || '1.0',
        signer_name: signerName.trim(),
        signer_email: signerEmail.trim().toLowerCase(),
        signature_method: signatureMethod,
        signature_data:
          signatureMethod === 'drawn'
            ? signatureData
            : signatureMethod === 'typed'
            ? signatureTyped?.trim()
            : null,
        accepted_at: timestamp,
        ip_address,
        user_agent,
        legal_acknowledgment: true,
        role_at_signing: profile?.role || 'student',
      },
      { onConflict: 'user_id,agreement_type,document_version' }
    );

  if (insertError) {
    logger.error('signAgreement: insert error', insertError);
    return { error: 'Failed to record signature' };
  }

  // Audit log — non-fatal
  supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'agreement_signed',
    resource_type: 'license_agreement_acceptances',
    metadata: { agreement_type: agreementType, signer_name: signerName, context, ip_address, timestamp },
  }).catch(() => {});

  return { success: true };
}
