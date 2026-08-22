/**
 * Compliance Components Index
 *
 * Centralized exports for compliance-related components.
 * Cookie consent is owned by components/CookieConsent.tsx and mounted by the
 * marketing root layout; do not introduce a second consent implementation.
 */

// Core compliance notices
export { ComplianceNotice } from './ComplianceNotice';
export { default as PathwayDisclosure, PATHWAY_DISCLOSURE } from './PathwayDisclosure';
export { PolicyReference } from './PolicyReference';

// Guardrail components
export {
  NoGuaranteeDisclaimer,
  FundingDisclaimer,
  NotAdviceDisclaimer,
  VerificationDate,
  AccreditationNotice,
  TestimonialDisclaimer,
  SalaryDisclaimer,
  ApplicationConsent,
  ComplianceFooterLinks,
  ProgramComplianceBanner,
} from './ComplianceGuardrails';

// Program-specific compliance
export { default as BarberEnrollmentAcknowledgment } from './BarberEnrollmentAcknowledgment';
export { default as BeautyEnrollmentAcknowledgment } from './BeautyEnrollmentAcknowledgment';
export { default as HostShopRequirements } from './HostShopRequirements';
export { default as BarberProgramFAQ } from './BarberProgramFAQ';

// Training compliance
export { default as FERPATrainingDashboard } from './FERPATrainingDashboard';
export { default as FERPATrainingForm } from './FERPATrainingForm';
