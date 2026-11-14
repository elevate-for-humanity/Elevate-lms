import type {BasePartnerAPI,PartnerType} from './base';

/**
 * API enrollment is unavailable until a vendor adapter has a verified contract.
 * Do not manufacture vendor accounts, enrollments, launch URLs or progress.
 * Existing manual/link enrollment uses the separate link-based integration.
 */
export class PartnerIntegrationUnavailableError extends Error {
  readonly code = 'PARTNER_API_NOT_CONNECTED';
  constructor() {
    super('PARTNER_API_NOT_CONNECTED: Vendor API enrollment and progress are not connected. Use the existing manual/link enrollment workflow.');
    this.name = 'PartnerIntegrationUnavailableError';
  }
}

export function getPartnerClient(_partner: PartnerType): BasePartnerAPI {
  // The former pending client returned synthetic success for every vendor,
  // even with no configured API. Keep the existing callers' failure paths and
  // student records intact until an independently verified adapter is wired.
  throw new PartnerIntegrationUnavailableError();
}

export * from './base';
