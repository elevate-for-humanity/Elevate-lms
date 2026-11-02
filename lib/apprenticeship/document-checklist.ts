/** Shared read-only checklist for the apprentice home, records and Documents page. */
export function isLearnerUploadRequirement(item: { document_type?: string | null }) {
  return !['apprenticeship_agreement', 'employer_verification', 'offer_letter'].includes(
    String(item.document_type || '').toLowerCase(),
  );
}

export function isApprovedApprenticeDocument(doc: {
  verification_status?: string | null;
  status?: string | null;
}) {
  return ['approved', 'verified', 'accepted'].includes(
    String(doc.verification_status || doc.status || '').toLowerCase(),
  );
}

export function apprenticeDocumentChecklist<
  R extends { document_type?: string | null; is_required?: boolean | null },
  D extends {
    document_type?: string | null;
    verification_status?: string | null;
    status?: string | null;
  },
>(requirements: R[], documents: D[], agreementSigned: boolean) {
  const uploads = requirements.filter(isLearnerUploadRequirement);
  const rows = uploads.map((requirement) => {
    const matching = documents.filter((doc) => doc.document_type === requirement.document_type);
    // Approved evidence is immutable in the upload API. A later pending copy
    // must not hide the accepted evidence or ask the learner to replace it.
    const document = matching.find(isApprovedApprenticeDocument) || matching[0];
    const raw = String(
      document?.verification_status || document?.status || 'missing',
    ).toLowerCase();
    const status =
      document && isApprovedApprenticeDocument(document)
        ? 'complete'
        : raw === 'pending'
          ? 'pending'
          : raw === 'rejected'
            ? 'rejected'
            : 'missing';
    return { requirement, document, status };
  });
  const required = rows.filter(({ requirement }) => requirement.is_required);
  const requiredCount = required.length + 1;
  const missingCount =
    required.filter(({ status }) => status !== 'complete').length + (agreementSigned ? 0 : 1);
  return {
    rows,
    requiredCount,
    missingCount,
    completeCount: requiredCount - missingCount,
    configured: requirements.length > 0,
  };
}
