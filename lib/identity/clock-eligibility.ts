/**
 * Identity policy for apprenticeship timeclock access.
 *
 * Active apprentices created before this policy went live remain eligible under
 * the administrator-approved transition decision. New apprentices must have a
 * complete, approved ID + selfie package from the secure identity workflow.
 */
export const IDENTITY_TIMECLOCK_ENFORCEMENT_AT = '2026-09-07T00:00:00.000Z';

type IdentityDocument = {
  document_type?: string | null;
  status?: string | null;
  verification_status?: string | null;
  verified?: boolean | null;
  metadata?: Record<string, unknown> | null;
};

export type IdentityClockEligibility = {
  eligible: boolean;
  basis: 'transition_cohort' | 'secure_identity_verified' | 'identity_required';
};

const accepted = (document: IdentityDocument) => {
  const states = [document.status, document.verification_status]
    .map((value) => String(value || '').toLowerCase());
  return document.verified === true || states.some((state) => state === 'approved' || state === 'verified');
};

export function evaluateIdentityClockEligibility(
  apprenticeCreatedAt: string | null | undefined,
  documents: IdentityDocument[],
  providerVerified = false,
): IdentityClockEligibility {
  if (
    apprenticeCreatedAt &&
    new Date(apprenticeCreatedAt).getTime() < new Date(IDENTITY_TIMECLOCK_ENFORCEMENT_AT).getTime()
  ) {
    return { eligible: true, basis: 'transition_cohort' };
  }

  if (providerVerified) {
    return { eligible: true, basis: 'secure_identity_verified' };
  }

  const approvedIdentityParts = new Set(
    documents
      .filter((document) => document.document_type === 'photo_id' && accepted(document))
      .map((document) => String(document.metadata?.identity_part || '').toLowerCase())
      .filter(Boolean),
  );

  const hasFront = approvedIdentityParts.has('front');
  const hasSelfie = approvedIdentityParts.has('selfie');
  const hasBack = approvedIdentityParts.has('back');
  const passport = documents.some(
    (document) =>
      document.document_type === 'photo_id' &&
      accepted(document) &&
      String(document.metadata?.id_type || '').toLowerCase() === 'passport',
  );

  if (hasFront && hasSelfie && (passport || hasBack)) {
    return { eligible: true, basis: 'secure_identity_verified' };
  }

  return { eligible: false, basis: 'identity_required' };
}
