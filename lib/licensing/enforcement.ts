/**
 * License Enforcement
 * Validates license status and feature entitlements
 * Handles refunds and disputes
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { suspendLicense } from './provisioning';

import { logAuditEvent } from '@/lib/audit';
import { setAuditContext } from '@/lib/audit-context';
import * as crypto from 'node:crypto';

interface LicenseValidation {
  valid: boolean;
  status: 'active' | 'suspended' | 'expired' | 'revoked' | 'not_found';
  tenantId?: string;
  features?: Record<string, boolean>;
  expiresAt?: string;
  message?: string;
}

/**
 * Validate a license by key
 */
export async function validateLicense(licenseKey: string): Promise<LicenseValidation> {
  const supabase = createAdminClient();

  const { data: license } = await supabase
    .from('licenses')
    .select('id, tenant_id, status, features, expires_at, tier, max_users')
    .eq('license_key', licenseKey)
    .single();

  if (!license) {
    return { valid: false, status: 'not_found', message: 'License not found' };
  }

  // Check expiration
  if (license.expires_at && new Date(license.expires_at) < new Date()) {
    return { 
      valid: false, 
      status: 'expired', 
      tenantId: license.tenant_id,
      message: 'License has expired' 
    };
  }

  // Check status
  if (license.status !== 'active') {
    return { 
      valid: false, 
      status: license.status,
      tenantId: license.tenant_id,
      message: `License is ${license.status}` 
    };
  }

  // Convert features array to object
  const featuresObj: Record<string, boolean> = {};
  if (Array.isArray(license.features)) {
    license.features.forEach((f: string) => { featuresObj[f] = true; });
  }

  return {
    valid: true,
    status: 'active',
    tenantId: license.tenant_id,
    features: featuresObj,
    expiresAt: license.expires_at,
  };
}

/**
 * Validate license by tenant ID
 */
export async function validateTenantLicense(tenantId: string): Promise<LicenseValidation> {
  const supabase = createAdminClient();

  const { data: tenant } = await supabase
    .from('tenants')
    .select('license_status, license_expires_at')
    .eq('id', tenantId)
    .single();

  if (!tenant) {
    return { valid: false, status: 'not_found', message: 'Tenant not found' };
  }

  // Check expiration
  if (tenant.license_expires_at && new Date(tenant.license_expires_at) < new Date()) {
    return { 
      valid: false, 
      status: 'expired', 
      tenantId,
      message: 'License has expired' 
    };
  }

  // Check status
  if (tenant.license_status !== 'active') {
    return { 
      valid: false, 
      status: tenant.license_status,
      tenantId,
      message: `License is ${tenant.license_status}` 
    };
  }

  // Get features from license
  const { data: license } = await supabase
    .from('licenses')
    .select('features, expires_at')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .single();

  return {
    valid: true,
    status: 'active',
    tenantId,
    features: license?.features as Record<string, boolean>,
    expiresAt: license?.expires_at || tenant.license_expires_at,
  };
}

/**
 * Check if tenant has specific feature
 */
export async function checkFeatureAccess(
  tenantId: string, 
  feature: string
): Promise<{ allowed: boolean; reason?: string }> {
  const validation = await validateTenantLicense(tenantId);

  if (!validation.valid) {
    return { allowed: false, reason: validation.message };
  }

  if (!validation.features) {
    // No feature restrictions - allow all
    return { allowed: true };
  }

  if (validation.features[feature] === false) {
    return { allowed: false, reason: `Feature '${feature}' not included in license` };
  }

  return { allowed: true };
}

/**
 * Handle Stripe refund event
 */
export async function handleRefund(paymentIntentId: string): Promise<void> {
  const supabase = createAdminClient();
  const requestId = crypto.randomUUID();

  await setAuditContext(supabase, { systemActor: 'stripe_refund_handler', requestId });

  // Find the purchase
  const { data: purchase } = await supabase
    .from('license_purchases')
    .select('tenant_id, license_id')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single();

  if (!purchase?.tenant_id) {
    logger.warn('Refund received for unknown payment', { paymentIntentId });
    return;
  }

  // Update purchase status
  await supabase
    .from('license_purchases')
    .update({ status: 'refunded' })
    .eq('stripe_payment_intent_id', paymentIntentId);

  // Suspend the license (already has its own audit context + L1 event)
  await suspendLicense(purchase.tenant_id, 'refund_processed');

  await logAuditEvent({
    action: 'LICENSE_REFUND_PROCESSED',
    actor_id: 'system:stripe_refund_handler',
    target_type: 'license_purchase',
    target_id: purchase.license_id || paymentIntentId,
    metadata: { payment_intent_id: paymentIntentId, tenant_id: purchase.tenant_id },
  });

  logger.info('License suspended due to refund', { 
    paymentIntentId, 
    tenantId: purchase.tenant_id 
  });
}

/**
 * Handle Stripe dispute event
 */
export async function handleDispute(paymentIntentId: string): Promise<void> {
  const supabase = createAdminClient();
  const requestId = crypto.randomUUID();

  await setAuditContext(supabase, { systemActor: 'stripe_dispute_handler', requestId });

  // Find the purchase
  const { data: purchase } = await supabase
    .from('license_purchases')
    .select('tenant_id, license_id')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single();

  if (!purchase?.tenant_id) {
    logger.warn('Dispute received for unknown payment', { paymentIntentId });
    return;
  }

  // Update purchase status
  await supabase
    .from('license_purchases')
    .update({ status: 'disputed' })
    .eq('stripe_payment_intent_id', paymentIntentId);

  // Suspend the license immediately (already has its own audit context + L1 event)
  await suspendLicense(purchase.tenant_id, 'dispute_opened');

  await logAuditEvent({
    action: 'LICENSE_DISPUTE_OPENED',
    actor_id: 'system:stripe_dispute_handler',
    target_type: 'license_purchase',
    target_id: purchase.license_id || paymentIntentId,
    metadata: { payment_intent_id: paymentIntentId, tenant_id: purchase.tenant_id },
  });

  logger.info('License suspended due to dispute', { 
    paymentIntentId, 
    tenantId: purchase.tenant_id 
  });
}

/**
 * Revoke a license permanently
 */
export async function revokeLicense(tenantId: string, reason: string): Promise<void> {
  const supabase = createAdminClient();
  const requestId = crypto.randomUUID();

  await setAuditContext(supabase, { systemActor: 'license_enforcement', requestId });

  await supabase
    .from('tenants')
    .update({ license_status: 'cancelled' })
    .eq('id', tenantId);

  await supabase
    .from('licenses')
    .update({ status: 'revoked' })
    .eq('tenant_id', tenantId);

  await logAuditEvent({
    action: 'LICENSE_REVOKED',
    actor_id: 'system:license_enforcement',
    target_type: 'tenant',
    target_id: tenantId,
    metadata: { reason, correlation_id: requestId },
  });

  logger.info('License revoked', { tenantId, reason });
}

/**
 * Extend license expiration
 */
export async function extendLicense(
  tenantId: string, 
  newExpirationDate: Date
): Promise<void> {
  const supabase = createAdminClient();
  const requestId = crypto.randomUUID();

  await setAuditContext(supabase, { systemActor: 'license_enforcement', requestId });

  await supabase
    .from('tenants')
    .update({ license_expires_at: newExpirationDate.toISOString() })
    .eq('id', tenantId);

  await supabase
    .from('licenses')
    .update({ expires_at: newExpirationDate.toISOString() })
    .eq('tenant_id', tenantId);

  await logAuditEvent({
    action: 'LICENSE_EXTENDED',
    actor_id: 'system:license_enforcement',
    target_type: 'tenant',
    target_id: tenantId,
    metadata: { new_expiration: newExpirationDate.toISOString(), correlation_id: requestId },
  });

  logger.info('License extended', { tenantId, expiresAt: newExpirationDate });
}
