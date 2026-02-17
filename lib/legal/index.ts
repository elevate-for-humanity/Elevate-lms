/**
 * Legal Module Exports
 * 
 * Canonical agreement handling for compliance enforcement.
 */

export {
  recordAgreementAcceptance,
  recordMultipleAgreements,
  extractRequestMetadata,
  type AgreementType,
  type SignatureMethod,
  type RecordAgreementParams,
  type RecordAgreementResult,
} from './recordAgreementAcceptance';

export {
  REQUIRED_AGREEMENTS,
  PROTECTED_ROUTES,
  EXEMPT_ROUTES,
  getRequiredAgreements,
  getMissingAgreements,
  hasSignedAllRequired,
  requiresAgreementGating,
  getRouteRoles,
  type RequiredAgreement,
  type UserRole,
} from './requiredAgreements';
