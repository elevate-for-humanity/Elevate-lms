import type { CurrentHostShopPartner } from './current-host-shop';

export function hostShopReadyForReview(partner: CurrentHostShopPartner, documents: { requiredDocumentCount: number; documentStatuses: Array<{ is_required?: boolean; uploaded?: boolean; status: string }> }) {
  return Boolean(
    partner.phone && partner.supervisor_name && partner.supervisor_license_number &&
    partner.compensation_model && partner.workers_comp_status &&
    partner.has_general_liability && partner.can_supervise_and_verify && partner.mou_signed &&
    documents.requiredDocumentCount > 0 &&
    documents.documentStatuses.filter((item) => item.is_required).length === documents.requiredDocumentCount &&
    documents.documentStatuses.filter((item) => item.is_required).every((item) => item.uploaded && ['pending', 'accepted'].includes(item.status))
  );
}
