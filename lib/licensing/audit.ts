/**
 * License Audit Logging
 * 
 * Tracks all license-related operations for security and compliance.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export type LicenseAuditEvent = 
  | 'license.created'
  | 'license.validated'
  | 'license.validation_failed'
  | 'license.expired'
  | 'license.suspended'
  | 'license.renewed'
  | 'license.upgraded'
  | 'license.downgraded'
  | 'license.revoked'
  | 'feature.accessed'
  | 'feature.denied'
  | 'limit.exceeded'
  | 'clone.requested'
  | 'clone.completed';

export interface LicenseAuditEntry {
  event: LicenseAuditEvent;
  licenseId?: string;
  tenantId?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * Log a license audit event
 */
export async function auditLicenseEvent(entry: LicenseAuditEntry): Promise<void> {
  const { event, licenseId, tenantId, userId, ipAddress, userAgent, metadata } = entry;

  // Always log to application logger
  logger.info(`License audit: ${event}`, {
    licenseId,
    tenantId,
    userId,
    ipAddress,
    ...metadata,
  });

  // Attempt to store in database for persistent audit trail
  try {
    const supabase = createAdminClient();
    
    await supabase.from('license_audit_log').insert({
      user_id: userId,
      action: event,
      ip_address: ipAddress,
      details: {
        license_id: licenseId,
        tenant_id: tenantId,
        user_agent: userAgent,
        ...metadata,
      },
    });
  } catch (error) {
    // Don't fail the operation if audit logging fails
    logger.warn('Failed to persist license audit log', { event, error });
  }
}

/**
 * Log license creation
 */
export async function auditLicenseCreated(
  licenseId: string,
  tenantId: string,
  metadata: { tier: string; email: string; generatedBy: string }
): Promise<void> {
  await auditLicenseEvent({
    event: 'license.created',
    licenseId,
    tenantId,
    metadata,
  });
}

/**
 * Log license validation attempt
 */
export async function auditLicenseValidation(
  licenseId: string,
  success: boolean,
  ipAddress: string,
  metadata?: Record<string, any>
): Promise<void> {
  await auditLicenseEvent({
    event: success ? 'license.validated' : 'license.validation_failed',
    licenseId,
    ipAddress,
    metadata,
  });
}

/**
 * Log feature access attempt
 */
export async function auditFeatureAccess(
  tenantId: string,
  feature: string,
  granted: boolean,
  userId?: string
): Promise<void> {
  await auditLicenseEvent({
    event: granted ? 'feature.accessed' : 'feature.denied',
    tenantId,
    userId,
    metadata: { feature },
  });
}

/**
 * Log limit exceeded event
 */
export async function auditLimitExceeded(
  tenantId: string,
  limitType: string,
  current: number,
  max: number
): Promise<void> {
  await auditLicenseEvent({
    event: 'limit.exceeded',
    tenantId,
    metadata: { limitType, current, max },
  });
}

/**
 * Log clone operation
 */
export async function auditCloneOperation(
  licenseId: string,
  stage: 'requested' | 'completed',
  targetRepo: string,
  ipAddress: string
): Promise<void> {
  await auditLicenseEvent({
    event: stage === 'requested' ? 'clone.requested' : 'clone.completed',
    licenseId,
    ipAddress,
    metadata: { targetRepo },
  });
}
