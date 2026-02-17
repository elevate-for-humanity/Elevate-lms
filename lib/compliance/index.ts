/**
 * Compliance Module Exports
 * 
 * Client-side utilities for compliance enforcement.
 * For server-side usage, import from '@/lib/compliance/server'
 */

export {
  checkComplianceStatus,
  checkComplianceStatusWithClient,
  recordAgreementAcceptance,
  recordHandbookAcknowledgment,
  updateOnboardingProgress,
  getUserAgreements,
  getCurrentAgreementVersions,
  logComplianceEvent,
  REQUIRED_AGREEMENTS,
  type ComplianceStatus,
  type AgreementAcceptance,
} from './enforcement';
