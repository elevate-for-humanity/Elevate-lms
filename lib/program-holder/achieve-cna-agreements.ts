import { createHash } from 'node:crypto';

export { ACHIEVE_HOLDER_ID } from './achieve-holder';
const AGREEMENT_TYPES = { mou: 'program_holder_mou', nda: 'nda' } as const;
export const ACHIEVE_SCHEDULE_FIELDS = {
  collecting_party: 'Collecting party',
  disbursement_method: 'Disbursement method',
  invoice_evidence: 'Invoice evidence',
  invoice_due_dates: 'Invoice due dates',
  payment_timing: 'Payment timing',
  refund_allocation: 'Refund allocation',
} as const;
export type AchieveDocument = keyof typeof AGREEMENT_TYPES;

export function achieveCnaAgreements(features: Record<string, unknown> | null | undefined) {
  const value = features?.achieve_cna_agreements;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const packet = value as Record<string, unknown>;
  const { mou, nda, schedule_a: schedule, approval_reference: approvalReference } = packet;
  if (Object.keys(packet).length !== 4 || typeof approvalReference !== 'string' || !approvalReference.trim() || approvalReference.length > 300 ||
      typeof mou !== 'string' || !mou.trim() || mou.length > 32000 ||
      typeof nda !== 'string' || !nda.trim() || nda.length > 32000 ||
      !schedule || typeof schedule !== 'object' || Array.isArray(schedule)) return null;

  const fields = Object.entries(ACHIEVE_SCHEDULE_FIELDS).map(([key, label]) => ({
    label,
    value: (schedule as Record<string, unknown>)[key],
  }));
  if (Object.keys(schedule).length !== fields.length || !fields.every(({ value }) => typeof value === 'string' && value.trim() && value.length <= 4000)) return null;

  const scheduleTerms = fields.map(({ label, value }) => ({ label, value: String(value).trim() }));
  const digest = createHash('sha256').update(JSON.stringify({ mou, nda, scheduleTerms, approvalReference })).digest('hex');
  return { packet, mou, nda, scheduleTerms, digest, approvalReference };
}

export function achieveDocumentVersion(kind: AchieveDocument, digest: string) {
  return `achieve-cna-${kind}-${digest}`;
}

export function hasCurrentAchieveSignature(
  features: Record<string, unknown> | null | undefined,
  kind: AchieveDocument,
  digest: string | undefined,
): boolean {
  const signed = features?.[`achieve_cna_signed_${kind}`] as { version?: string; acceptance_id?: string } | undefined;
  return Boolean(signed?.acceptance_id && digest && signed.version === achieveDocumentVersion(kind, digest));
}
