'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export type SignAgreementInput = {
  agreementType: string;
  agreementVersion?: string;
  signerName: string;
  signerEmail?: string;
  signatureMethod: 'checkbox' | 'typed' | 'drawn';
  signatureTyped?: string;
  signatureData?: string;
  context?: string;
};

export async function signAgreement(input: SignAgreementInput) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'Authentication is required to sign this agreement.' };

  const signerName = input.signerName.trim();
  if (!signerName) return { error: 'Enter your legal name before signing.' };
  if (input.signatureMethod === 'typed' && !input.signatureTyped?.trim()) {
    return { error: 'Enter your typed signature before continuing.' };
  }
  if (input.signatureMethod === 'drawn' && !input.signatureData) {
    return { error: 'Draw your signature before continuing.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id, email')
    .eq('id', user.id)
    .maybeSingle();

  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
  const signatureData = input.signatureMethod === 'drawn'
    ? input.signatureData
    : input.signatureMethod === 'typed'
      ? input.signatureTyped?.trim()
      : 'acknowledged';

  const version = input.agreementVersion || '1.0';
  const record = {
    user_id: user.id,
    organization_id: profile?.tenant_id || null,
    role_at_signing: profile?.role || null,
    agreement_type: input.agreementType,
    document_version: version,
    signer_name: signerName,
    signer_email: input.signerEmail || user.email || profile?.email || null,
    signature_method: input.signatureMethod,
    signature_data: signatureData || null,
    accepted_at: new Date().toISOString(),
    ip_address: forwardedFor,
    user_agent: requestHeaders.get('user-agent'),
    legal_acknowledgment: true,
  };

  const { data: existing } = await supabase
    .from('license_agreement_acceptances')
    .select('id')
    .eq('user_id', user.id)
    .eq('agreement_type', input.agreementType)
    .eq('document_version', version)
    .maybeSingle();

  const query = existing?.id
    ? supabase.from('license_agreement_acceptances').update(record).eq('id', existing.id)
    : supabase.from('license_agreement_acceptances').insert(record);
  const { error } = await query;
  if (error) return { error: error.message };

  return { success: true, signedAt: record.accepted_at };
}
