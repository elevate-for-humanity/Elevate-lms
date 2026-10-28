'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import {
  recordAgreementAcceptance,
  type AgreementType,
} from '@/lib/legal/recordAgreementAcceptance';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { requireAdminClient } from '@/lib/supabase/admin';
import { checkAndSendOnboardingCompleteEmail } from '@/lib/program-holder/onboarding-complete';
import { paymentAddendum } from '@/lib/program-holder/payment-addendum';

export async function signAgreement(data: {
  agreementType: string;
  agreementVersion: string;
  method: 'checkbox' | 'typed' | 'drawn';
  signature?: string;
  typedName?: string;
  studentId?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email)
    return { success: false, error: 'You must be signed in to sign this agreement.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, tenant_id, organization_id, program_holder_id')
    .eq('id', user.id)
    .maybeSingle();

  let signingPaymentAddendum = false;
  if (data.agreementType === 'program_holder_mou') {
    const context = await requireProgramHolder();
    if (context.mode !== 'holder' || context.user.id !== user.id) return { success: false, error: 'Sign the current Program Holder agreement from your own portal.' };
    const { data: agreementHolder, error: agreementError } = await context.db.from('program_holders').select('features').eq('id', context.holderId).maybeSingle();
    if (agreementError || !agreementHolder) return { success: false, error: 'Agreement readiness could not be checked. Please retry.' };
    const addendum = paymentAddendum(agreementHolder.features, context.holderId);
    signingPaymentAddendum = Boolean(addendum && data.agreementVersion === addendum.version);
    if (!signingPaymentAddendum && data.agreementVersion !== `3.0-${context.holderId}`)
      return { success: false, error: 'The agreement changed. Reload and review the current terms before signing.' };
    if (agreementHolder.features?.full_forms_status === 'review_pending') return { success: false, error: 'The full agreement requires completed legal entities and payment terms before signature.' };
  }
  const requestHeaders = await headers();
  const ipAddress =
    requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    requestHeaders.get('x-real-ip') ||
    requestHeaders.get('cf-connecting-ip') ||
    '0.0.0.0';
  const userAgent = requestHeaders.get('user-agent') || 'unknown';
  const signerName = String(data.typedName || profile?.full_name || user.email).trim();

  const result = await recordAgreementAcceptance({
    supabase,
    userId: user.id,
    userEmail: user.email,
    userRole: String(profile?.role || 'student'),
    agreementType: data.agreementType as AgreementType,
    documentVersion: data.agreementVersion || '1.0',
    signerName,
    signerEmail: user.email,
    signatureMethod: data.method,
    signatureTyped: data.method === 'typed' ? signerName : undefined,
    signatureData: data.method === 'drawn' ? data.signature : undefined,
    ipAddress,
    userAgent,
    context: 'onboarding',
    organizationId: profile?.organization_id || undefined,
    tenantId: profile?.tenant_id || undefined,
  });

  if (!result.success)
    return { success: false, error: result.error || 'Agreement could not be recorded.' };

  if (data.agreementType === 'program_holder_mou' && !signingPaymentAddendum && profile?.program_holder_id) {
    const db = await requireAdminClient();
    const signedAt = new Date().toISOString();
    const { error: holderError } = await db
      .from('program_holders')
      .update({
        mou_signed: true,
        mou_signed_at: signedAt,
        mou_holder_signed_at: signedAt,
        mou_holder_name: signerName,
        mou_status: 'signed',
        status: 'active',
        updated_at: signedAt,
      })
      .eq('id', profile.program_holder_id);
    if (holderError)
      return {
        success: false,
        error:
          'The signature was recorded, but the Program Holder record could not be activated. Please contact support.',
      };
    await checkAndSendOnboardingCompleteEmail(db, user.id);
  }

  return {
    success: true,
    id: result.id,
    alreadyExists: result.alreadyExists,
    timestamp: new Date().toISOString(),
  };
}
