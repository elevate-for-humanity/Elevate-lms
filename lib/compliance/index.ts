/**
 * Compliance Module Exports
 *
 * Client-side utilities for compliance enforcement.
 * For server-side usage, import from '@/lib/compliance/server'
 */

export {
  checkComplianceStatus,
  recordAgreementAcceptance,
  recordHandbookAcknowledgment,
  updateOnboardingProgress,
  getCurrentAgreementVersions,
  type ComplianceStatus,
} from './enforcement';

export { REQUIRED_AGREEMENTS } from '@/lib/legal/requiredAgreements';
