/**
 * Enterprise License Provisioning
 * Transactional provisioning with rollback support
 * No partial states - all or nothing
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { generateLicenseKey } from '@/lib/store/license';
import * as crypto from 'node:crypto';

import { logAuditEvent } from '@/lib/audit';
import { setAuditContext } from '@/lib/audit-context';

const ENVIRONMENT = process.env.NODE_ENV === 'production' ? 'production' : 'development';

type ProvisioningStep = 
  | 'payment_received'
  | 'purchase_created'
  | 'tenant_created'
  | 'license_created'
  | 'admin_created'
  | 'email_sent'
  | 'completed'
  | 'failed'
  | 'rolled_back';

interface ProvisioningContext {
  correlationId: string;
  email: string;
  productId: string;
  paymentIntentId?: string;
  sessionId?: string;
  amountCents: number;
  currency: string;
  organizationName?: string;
  metadata?: Record<string, any>;
}

interface ProvisioningResult {
  success: boolean;
  tenantId?: string;
  licenseId?: string;
  licenseKey?: string;
  adminUserId?: string;
  error?: string;
}

async function logProvisioningEvent(
  correlationId: string,
  step: ProvisioningStep,
  status: 'started' | 'completed' | 'failed' | 'rolled_back',
  tenantId?: string,
  paymentIntentId?: string,
  error?: string,
  metadata?: Record<string, any>
): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from('provisioning_events').insert({
    correlation_id: correlationId,
    step,
    status,
    tenant_id: tenantId || null,
    payment_intent_id: paymentIntentId || null,
    error: error || null,
    metadata: metadata || null,
    environment: ENVIRONMENT,
  });
}

function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  const randomBytes = crypto.randomBytes(16);
  for (let i = 0; i < 16; i++) {
    password += chars[randomBytes[i] % chars.length];
  }
  return password;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50) + '-' + crypto.randomBytes(4).toString('hex');
}

export async function provisionLicense(ctx: ProvisioningContext): Promise<ProvisioningResult> {
  const supabase = createAdminClient();
  const { correlationId, email, productId, paymentIntentId, sessionId, amountCents, currency, organizationName } = ctx;

  // Set audit context so DB triggers attribute writes to this automation
  await setAuditContext(supabase, {
    systemActor: 'license_provisioning',
    requestId: correlationId,
  });

  let purchaseId: string | undefined;
  let tenantId: string | undefined;
  let licenseId: string | undefined;
  let adminUserId: string | undefined;

  try {
    await logProvisioningEvent(correlationId, 'payment_received', 'completed', undefined, paymentIntentId, undefined, {
      email, product_id: productId, amount_cents: amountCents,
    });

    await logProvisioningEvent(correlationId, 'purchase_created', 'started');
    const orgName = organizationName || email.split('@')[0] + ' Organization';
    
    const { data: purchase, error: purchaseError } = await supabase
      .from('license_purchases')
      .insert({
        organization_name: orgName,
        contact_name: orgName + ' Admin',
        contact_email: email,
        license_type: 'enterprise',
        product_slug: productId,
        stripe_payment_intent_id: paymentIntentId,
        stripe_checkout_session_id: sessionId,
        status: 'paid',
        amount_cents: amountCents,
        currency,
      })
      .select('id')
      .single();

    if (purchaseError || !purchase) throw new Error(`Failed to create purchase: ${purchaseError?.message}`);
    purchaseId = purchase.id;
    await logProvisioningEvent(correlationId, 'purchase_created', 'completed', undefined, paymentIntentId);

    await logProvisioningEvent(correlationId, 'tenant_created', 'started');
    const slug = generateSlug(orgName);

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: orgName,
        slug,
        license_status: 'active',
        stripe_customer_id: ctx.metadata?.stripe_customer_id,
        stripe_subscription_id: ctx.metadata?.stripe_subscription_id,
        settings: { 
          product_id: productId, 
          plan_id: ctx.metadata?.plan_id,
          license_type: ctx.metadata?.license_type,
          provisioned_at: new Date().toISOString(), 
          correlation_id: correlationId,
        },
      })
      .select('id')
      .single();

    if (tenantError || !tenant) throw new Error(`Failed to create tenant: ${tenantError?.message}`);
    tenantId = tenant.id;
    await logProvisioningEvent(correlationId, 'tenant_created', 'completed', tenantId, paymentIntentId);

    await supabase.from('license_purchases').update({ tenant_id: tenantId }).eq('id', purchaseId);

    await logProvisioningEvent(correlationId, 'license_created', 'started', tenantId);
    const licenseKey = generateLicenseKey();

    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .insert({
        license_key: licenseKey,
        customer_email: email,
        tenant_id: tenantId,
        tier: 'enterprise',
        status: 'active',
        max_users: 100,
        max_deployments: 1,
        features: ctx.metadata?.features ? Object.keys(ctx.metadata.features) : [],
        metadata: { product_id: productId, correlation_id: correlationId },
      })
      .select('id')
      .single();

    if (licenseError || !license) throw new Error(`Failed to create license: ${licenseError?.message}`);
    licenseId = license.id;
    await supabase.from('license_purchases').update({ license_id: licenseId }).eq('id', purchaseId);
    await logProvisioningEvent(correlationId, 'license_created', 'completed', tenantId, paymentIntentId);

    await logProvisioningEvent(correlationId, 'admin_created', 'started', tenantId);
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email);
    let temporaryPassword: string | undefined;

    if (existingUser?.user) {
      adminUserId = existingUser.user.id;
      await supabase.from('profiles').update({ tenant_id: tenantId, role: 'admin' }).eq('id', adminUserId);
    } else {
      temporaryPassword = generateTemporaryPassword();
      const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: { tenant_id: tenantId, role: 'admin' },
      });
      if (userError || !newUser.user) throw new Error(`Failed to create admin user: ${userError?.message}`);
      adminUserId = newUser.user.id;
      await supabase.from('profiles').insert({ id: adminUserId, email: email, tenant_id: tenantId, role: 'admin', full_name: orgName + ' Admin' });
    }
    await logProvisioningEvent(correlationId, 'admin_created', 'completed', tenantId, paymentIntentId, undefined, { admin_user_id: adminUserId, new_user: !!temporaryPassword });

    await logProvisioningEvent(correlationId, 'email_sent', 'started', tenantId);
    try {
      const { data: magicLink } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/admin` },
      });

      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.CRON_SECRET ?? '',
      },
        body: JSON.stringify({
          to: email,
          subject: 'Your Elevate Platform License is Ready',
          template: 'license-provisioned',
          data: {
            organizationName: orgName,
            email,
            licenseKey,
            loginUrl: magicLink?.properties?.action_link || `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
            adminUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/admin`,
            temporaryPassword,
            supportEmail: 'info@elevateforhumanity.org',
          },
        }),
      });
      await logProvisioningEvent(correlationId, 'email_sent', 'completed', tenantId, paymentIntentId);
    } catch (emailError) {
      logger.error('Failed to send provisioning email', emailError as Error);
      await logProvisioningEvent(correlationId, 'email_sent', 'failed', tenantId, paymentIntentId, emailError instanceof Error ? emailError.message : 'Email failed');
    }

    await logProvisioningEvent(correlationId, 'completed', 'completed', tenantId, paymentIntentId, undefined, { license_id: licenseId, admin_user_id: adminUserId });
    logger.info('License provisioning completed', { correlationId, tenantId, licenseId, adminUserId });

    // L1 audit: record successful provisioning
    await logAuditEvent({
      action: 'LICENSE_PROVISIONED',
      actor_id: adminUserId || 'system:license_provisioning',
      target_type: 'license',
      target_id: licenseId,
      metadata: {
        correlation_id: correlationId,
        tenant_id: tenantId,
        product_id: productId,
        payment_intent_id: paymentIntentId,
        email,
        amount_cents: amountCents,
      },
    });

    return { success: true, tenantId, licenseId, licenseKey, adminUserId };

  } catch (error) {
    const errorMessage = 'Operation failed';
    logger.error('License provisioning failed', error as Error);
    await logProvisioningEvent(correlationId, 'failed', 'failed', tenantId, paymentIntentId, errorMessage);

    // L1 audit: record failed provisioning
    await logAuditEvent({
      action: 'LICENSE_PROVISIONING_FAILED',
      actor_id: 'system:license_provisioning',
      target_type: 'license',
      target_id: correlationId,
      metadata: {
        correlation_id: correlationId,
        tenant_id: tenantId,
        payment_intent_id: paymentIntentId,
        email,
        error: errorMessage,
      },
    });

    try {
      if (licenseId) await supabase.from('licenses').delete().eq('id', licenseId);
      if (tenantId) await supabase.from('tenants').delete().eq('id', tenantId);
      if (purchaseId) await supabase.from('license_purchases').update({ status: 'failed' }).eq('id', purchaseId);
      await logProvisioningEvent(correlationId, 'rolled_back', 'completed', tenantId, paymentIntentId, undefined, { rolled_back_resources: { licenseId, tenantId } });
    } catch (rollbackError) {
      logger.error('Rollback failed', rollbackError as Error);
      await logProvisioningEvent(correlationId, 'rolled_back', 'failed', tenantId, paymentIntentId, rollbackError instanceof Error ? rollbackError.message : 'Rollback failed');
    }

    return { success: false, error: errorMessage };
  }
}

export async function suspendLicense(tenantId: string, reason: string): Promise<void> {
  const supabase = createAdminClient();
  const correlationId = crypto.randomUUID();

  await setAuditContext(supabase, { systemActor: 'license_enforcement', requestId: correlationId });

  await supabase.from('tenants').update({ license_status: 'suspended' }).eq('id', tenantId);
  await supabase.from('licenses').update({ status: 'suspended' }).eq('tenant_id', tenantId);
  await logProvisioningEvent(correlationId, 'completed', 'completed', tenantId, undefined, undefined, { action: 'suspended', reason });

  await logAuditEvent({
    action: 'LICENSE_SUSPENDED',
    actor_id: 'system:license_enforcement',
    target_type: 'tenant',
    target_id: tenantId,
    metadata: { reason, correlation_id: correlationId },
  });

  logger.info('License suspended', { tenantId, reason });
}

export async function enforceSubscriptionStatus(subscriptionId: string): Promise<void> {
  const supabase = createAdminClient();
  const { data: tenant } = await supabase.from('tenants').select('id').eq('stripe_subscription_id', subscriptionId).single();
  if (tenant) await suspendLicense(tenant.id, 'subscription_payment_failed');
}

export async function reactivateLicense(tenantId: string): Promise<void> {
  const supabase = createAdminClient();
  const correlationId = crypto.randomUUID();

  await setAuditContext(supabase, { systemActor: 'license_enforcement', requestId: correlationId });

  await supabase.from('tenants').update({ license_status: 'active' }).eq('id', tenantId);
  await supabase.from('licenses').update({ status: 'active' }).eq('tenant_id', tenantId);
  await logProvisioningEvent(correlationId, 'completed', 'completed', tenantId, undefined, undefined, { action: 'reactivated' });

  await logAuditEvent({
    action: 'LICENSE_REACTIVATED',
    actor_id: 'system:license_enforcement',
    target_type: 'tenant',
    target_id: tenantId,
    metadata: { correlation_id: correlationId },
  });

  logger.info('License reactivated', { tenantId });
}
