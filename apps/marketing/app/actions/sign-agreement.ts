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
import {
  ACHIEVE_HOLDER_ID,
  achieveCnaAgreements,
  achieveCnaRevisionId,
  achieveDocumentVersion,
  type AchieveDocument,
} from '@/lib/program-holder/achieve-cna-agreements';
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

  const signingMou = data.agreementType === 'program_holder_mou';
  const signingAchieveNda = data.agreementType === 'nda' && data.agreementVersion?.startsWith('achieve-cna-');
  let signingPaymentAddendum = false;
  let holderId: string | undefined;
  let achieveSignature: {
    kind: AchieveDocument;
    features: Record<string, unknown>;
    packet: Record<string, unknown>;
    revisionId: string;
    updatedAt: string | null;
  } | undefined;
  if (signingMou || signingAchieveNda) {
    const context = await requireProgramHolder();
    if (context.mode !== 'holder' || context.user.id !== user.id) {
      return { success: false, error: 'Sign the current agreement from your own Program Holder portal.' };
    }
    holderId = context.holderId;
    const { data: holder, error } = await context.db.from('program_holders')
      .select('features,status,approved_at,updated_at').eq('id', holderId).maybeSingle();
    if (error || !holder) return { success: false, error: 'Agreement readiness could not be checked. Please retry.' };

    const addendum = paymentAddendum(holder.features, holderId);
    signingPaymentAddendum = Boolean(signingMou && addendum && data.agreementVersion === addendum.version);
    if (holderId === ACHIEVE_HOLDER_ID && !signingPaymentAddendum) {
      if (!holder.approved_at || !['active', 'approved', 'approved_pending_mou'].includes(holder.status)) {
        return { success: false, error: 'Your agreement will be available after approval.' };
      }
      const approved = achieveCnaAgreements(holder.features);
      const revisionId = achieveCnaRevisionId(holder.features);
      const kind = signingAchieveNda ? 'nda' : 'mou';
      if (!approved || !revisionId ||
          data.agreementVersion !== achieveDocumentVersion(kind, approved.digest, revisionId)) {
        return { success: false, error: 'The finalized CNA agreement is unavailable or changed. Open the current agreement before signing.' };
      }
      if (!['checkbox', 'typed', 'drawn'].includes(data.method) ||
          (data.method === 'typed' && (data.typedName?.trim().length ?? 0) < 2) ||
          (data.method === 'drawn' && !data.signature?.startsWith('data:image/png;base64,'))) {
        return { success: false, error: 'Enter a valid signature for the current agreement.' };
      }
      achieveSignature = {
        kind,
        features: holder.features,
        packet: approved.packet,
        revisionId,
        updatedAt: holder.updated_at,
      };
    } else if (signingAchieveNda || (!signingPaymentAddendum && data.agreementVersion !== `3.0-${holderId}`)) {
      return { success: false, error: 'The agreement changed. Reload and review the current terms before signing.' };
    }
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
    supabase: achieveSignature ? await requireAdminClient() : supabase,
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
    context: achieveSignature ? `achieve-cna-${achieveSignature.kind}:${achieveSignature.revisionId}` : 'onboarding',
    documentUrl: achieveSignature
      ? `db://public.achieve_cna_packet_revisions/${achieveSignature.revisionId}`
      : undefined,
    organizationId: profile?.organization_id || undefined,
    tenantId: profile?.tenant_id || undefined,
  });

  if (!result.success)
    return { success: false, error: result.error || 'Agreement could not be recorded.' };

  if (holderId && (achieveSignature || (signingMou && !signingPaymentAddendum))) {
    const db = await requireAdminClient();
    const signedAt = new Date().toISOString();
    if (achieveSignature && !result.id) return { success: false, error: 'The signature receipt could not be verified.' };
    const updates = {
      updated_at: signedAt,
      ...(signingMou ? {
        mou_signed: true,
        mou_signed_at: signedAt,
        mou_holder_signed_at: signedAt,
        mou_holder_name: signerName,
        mou_status: 'signed',
        status: 'active',
      } : {}),
      ...(achieveSignature ? {
        features: {
          ...achieveSignature.features,
          [`achieve_cna_signed_${achieveSignature.kind}`]: {
            packet: achieveSignature.packet,
            revision_id: achieveSignature.revisionId,
            version: data.agreementVersion,
            acceptance_id: result.id,
            signed_at: signedAt,
          },
        },
      } : {}),
    };
    let update = db.from('program_holders').update(updates).eq('id', holderId);
    if (achieveSignature) {
      update = achieveSignature.updatedAt === null
        ? update.is('updated_at', null)
        : update.eq('updated_at', achieveSignature.updatedAt);
    }
    const { data: saved, error: holderError } = await update.select('id').maybeSingle();
    if (holderError || !saved) {
      return { success: false, error: 'The signature receipt was recorded. Reload the agreement to finish updating your holder record.' };
    }
    await checkAndSendOnboardingCompleteEmail(db, user.id);
  }

  return {
    success: true,
    id: result.id,
    alreadyExists: result.alreadyExists,
    timestamp: new Date().toISOString(),
  };
}
