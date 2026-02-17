import { logger } from '@/lib/logger';
/**
 * Notification Service
 * 
 * Implements outbox pattern for reliable transactional email delivery.
 * Supports no-login token links for document re-upload and enrollment continuation.
 * 
 * Default sender: notifications@elevateforhumanity.org
 */

import { createAdminClient } from '@/lib/supabase/admin';

export type TemplateKey =
  | 'inquiry_received'
  | 'apprentice_submission_received'
  | 'hostshop_submission_received'
  | 'document_rejected'
  | 'document_verified'
  | 'hostshop_decision'
  | 'apprentice_decision'
  | 'transfer_evaluated'
  | 'match_assigned';

export interface NotificationData {
  toEmail: string;
  templateKey: TemplateKey;
  templateData: Record<string, any>;
  entityType?: string;
  entityId?: string;
  scheduledFor?: Date;
}

export interface TokenOptions {
  purpose: 'reupload' | 'continue_enrollment' | 'transfer_submission';
  targetUrl: string;
  userId?: string;
  email?: string;
  expiresDays?: number;
  maxUses?: number;
  metadata?: Record<string, any>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
const DEFAULT_FROM = 'notifications@elevateforhumanity.org';

/**
 * Enqueue a notification for delivery
 */
export async function enqueueNotification(data: NotificationData): Promise<string | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data: result, error } = await supabase.rpc('enqueue_notification', {
    p_to_email: data.toEmail,
    p_template_key: data.templateKey,
    p_template_data: data.templateData,
    p_entity_type: data.entityType || null,
    p_entity_id: data.entityId || null,
    p_scheduled_for: data.scheduledFor?.toISOString() || new Date().toISOString(),
  });

  if (error) {
    logger.error('Failed to enqueue notification:', error);
    return null;
  }

  return result;
}

/**
 * Generate a token for no-login links
 */
export async function generateToken(options: TokenOptions): Promise<string | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data: token, error } = await supabase.rpc('generate_notification_token', {
    p_purpose: options.purpose,
    p_target_url: options.targetUrl,
    p_user_id: options.userId || null,
    p_email: options.email || null,
    p_expires_days: options.expiresDays || 7,
    p_max_uses: options.maxUses || 5,
    p_metadata: options.metadata || {},
  });

  if (error) {
    logger.error('Failed to generate token:', error);
    return null;
  }

  return token;
}

/**
 * Validate and use a token
 */
export async function useToken(token: string): Promise<{
  valid: boolean;
  targetUrl?: string;
  purpose?: string;
  userId?: string;
  email?: string;
  metadata?: Record<string, any>;
} | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc('use_notification_token', {
    p_token: token,
  });

  if (error || !data || data.length === 0) {
    return { valid: false };
  }

  const result = data[0];
  return {
    valid: result.valid,
    targetUrl: result.target_url,
    purpose: result.purpose,
    userId: result.user_id,
    email: result.email,
    metadata: result.metadata,
  };
}

/**
 * Build a tokenized URL for no-login access
 */
export async function buildTokenUrl(
  basePath: string,
  options: Omit<TokenOptions, 'targetUrl'>
): Promise<string | null> {
  const targetUrl = `${SITE_URL}${basePath}`;
  const token = await generateToken({ ...options, targetUrl });
  
  if (!token) return null;
  
  const separator = basePath.includes('?') ? '&' : '?';
  return `${targetUrl}${separator}token=${token}`;
}

// ============================================================================
// Notification Helper Functions (call these from API routes)
// ============================================================================

/**
 * Notify: Inquiry received
 */
export async function notifyInquiryReceived(
  email: string,
  name: string,
  inquiryType: string
): Promise<void> {
  await enqueueNotification({
    toEmail: email,
    templateKey: 'inquiry_received',
    templateData: {
      name,
      inquiry_type: inquiryType,
      site_url: SITE_URL,
    },
  });
}

/**
 * Notify: Apprentice submission received
 */
export async function notifyApprenticeSubmissionReceived(
  email: string,
  name: string,
  applicationId: string
): Promise<void> {
  const continueUrl = await buildTokenUrl(
    '/lms/enroll/barber-apprenticeship',
    {
      purpose: 'continue_enrollment',
      email,
      expiresDays: 14,
      maxUses: 10,
      metadata: { application_id: applicationId },
    }
  );

  await enqueueNotification({
    toEmail: email,
    templateKey: 'apprentice_submission_received',
    templateData: {
      name,
      continue_url: continueUrl || `${SITE_URL}/login`,
      site_url: SITE_URL,
    },
    entityType: 'apprentice_application',
    entityId: applicationId,
  });
}

/**
 * Notify: Host shop submission received
 */
export async function notifyHostShopSubmissionReceived(
  email: string,
  shopName: string,
  applicationId: string
): Promise<void> {
  const continueUrl = await buildTokenUrl(
    '/portal/partner/enroll/host-shop',
    {
      purpose: 'continue_enrollment',
      email,
      expiresDays: 14,
      maxUses: 10,
      metadata: { application_id: applicationId },
    }
  );

  await enqueueNotification({
    toEmail: email,
    templateKey: 'hostshop_submission_received',
    templateData: {
      shop_name: shopName,
      continue_url: continueUrl || `${SITE_URL}/login`,
      site_url: SITE_URL,
    },
    entityType: 'hostshop_application',
    entityId: applicationId,
  });
}

/**
 * Notify: Document rejected
 */
export async function notifyDocumentRejected(
  email: string,
  name: string,
  documentType: string,
  rejectionReason: string,
  documentId: string,
  userId?: string
): Promise<void> {
  const reuploadUrl = await buildTokenUrl(
    `/upload/${documentType}`,
    {
      purpose: 'reupload',
      email,
      userId,
      expiresDays: 7,
      maxUses: 5,
      metadata: { document_id: documentId, document_type: documentType },
    }
  );

  await enqueueNotification({
    toEmail: email,
    templateKey: 'document_rejected',
    templateData: {
      name,
      document_type: formatDocumentType(documentType),
      rejection_reason: rejectionReason,
      reupload_url: reuploadUrl || `${SITE_URL}/login`,
      site_url: SITE_URL,
    },
    entityType: 'document',
    entityId: documentId,
  });
}

/**
 * Notify: Document verified
 */
export async function notifyDocumentVerified(
  email: string,
  name: string,
  documentType: string,
  nextStep: string,
  continueUrl?: string
): Promise<void> {
  await enqueueNotification({
    toEmail: email,
    templateKey: 'document_verified',
    templateData: {
      name,
      document_type: formatDocumentType(documentType),
      next_step: nextStep,
      continue_url: continueUrl || `${SITE_URL}/login`,
      site_url: SITE_URL,
    },
  });
}

/**
 * Notify: Host shop decision (approved/rejected)
 */
export async function notifyHostShopDecision(
  email: string,
  shopName: string,
  approved: boolean,
  applicationId: string,
  reason?: string
): Promise<void> {
  let onboardingUrl: string | null = null;
  
  if (approved) {
    onboardingUrl = await buildTokenUrl(
      '/shop/onboarding',
      {
        purpose: 'continue_enrollment',
        email,
        expiresDays: 14,
        maxUses: 10,
        metadata: { application_id: applicationId },
      }
    );
  }

  await enqueueNotification({
    toEmail: email,
    templateKey: 'hostshop_decision',
    templateData: {
      shop_name: shopName,
      approved,
      reason: reason || '',
      onboarding_url: onboardingUrl || `${SITE_URL}/login`,
      site_url: SITE_URL,
    },
    entityType: 'hostshop_application',
    entityId: applicationId,
  });
}

/**
 * Notify: Apprentice decision (approved/rejected)
 */
export async function notifyApprenticeDecision(
  email: string,
  name: string,
  approved: boolean,
  applicationId: string,
  reason?: string
): Promise<void> {
  let portalUrl: string | null = null;
  
  if (approved) {
    portalUrl = await buildTokenUrl(
      '/learner/dashboard',
      {
        purpose: 'continue_enrollment',
        email,
        expiresDays: 14,
        maxUses: 10,
        metadata: { application_id: applicationId },
      }
    );
  }

  await enqueueNotification({
    toEmail: email,
    templateKey: 'apprentice_decision',
    templateData: {
      name,
      approved,
      reason: reason || '',
      portal_url: portalUrl || `${SITE_URL}/login`,
      site_url: SITE_URL,
    },
    entityType: 'apprentice_application',
    entityId: applicationId,
  });
}

/**
 * Notify: Transfer evaluation complete
 */
export async function notifyTransferEvaluated(
  email: string,
  name: string,
  acceptedHours: number,
  remainingHours: number,
  transferId: string
): Promise<void> {
  await enqueueNotification({
    toEmail: email,
    templateKey: 'transfer_evaluated',
    templateData: {
      name,
      accepted_hours: acceptedHours,
      remaining_hours: remainingHours,
      site_url: SITE_URL,
    },
    entityType: 'transfer_request',
    entityId: transferId,
  });
}

/**
 * Notify: Match assigned (apprentice matched to shop)
 */
export async function notifyMatchAssigned(
  apprenticeEmail: string,
  apprenticeName: string,
  shopEmail: string,
  shopName: string,
  startDate: string,
  matchId: string
): Promise<void> {
  // Notify apprentice
  await enqueueNotification({
    toEmail: apprenticeEmail,
    templateKey: 'match_assigned',
    templateData: {
      recipient_type: 'apprentice',
      name: apprenticeName,
      shop_name: shopName,
      start_date: startDate,
      site_url: SITE_URL,
    },
    entityType: 'match',
    entityId: matchId,
  });

  // Notify host shop
  await enqueueNotification({
    toEmail: shopEmail,
    templateKey: 'match_assigned',
    templateData: {
      recipient_type: 'host_shop',
      apprentice_name: apprenticeName,
      shop_name: shopName,
      start_date: startDate,
      site_url: SITE_URL,
    },
    entityType: 'match',
    entityId: matchId,
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatDocumentType(type: string): string {
  const labels: Record<string, string> = {
    photo_id: 'Photo ID',
    shop_license: 'Shop License',
    barber_license: 'Barber License',
    school_transcript: 'School Transcript',
    certificate: 'Certificate',
    out_of_state_license: 'Out-of-State License',
    ce_certificate: 'CE Certificate',
    employment_verification: 'Employment Verification',
  };
  return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
