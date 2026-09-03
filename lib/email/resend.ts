/**
 * Compatibility shim — delegates to the canonical sendgrid module.
 * Import from '@/lib/email/sendgrid' or '@/lib/email' for new code.
 */
export {
  sendEmail,
  trySendEmail,
  sendWelcomeEmail,
  sendCreatorApprovalEmail,
  sendCreatorRejectionEmail,
  sendPayoutConfirmationEmail,
  sendProductApprovalEmail,
  sendProductRejectionEmail,
  sendMarketplaceSaleNotification,
  sendMarketplaceApplicationEmail,
} from './sendgrid';
export type { EmailOptions } from './sendgrid';
