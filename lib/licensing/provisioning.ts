import * as crypto from 'node:crypto';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { generateLicenseKey } from '@/lib/store/license';
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

type AdminUserRecord = { id: string; email?: string | null };

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

export interface ProvisioningResult {
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
  metadata?: Record<string, any>,
) {
  const supabase = await requireAdminClient();
  const { error: insertError } = await supabase.from('provisioning_events').insert({
    correlation_id: correlationId,
    step,
    status,
    tenant_id: tenantId || null,
    payment_intent_id: paymentIntentId || null,
    error: error || null,
    metadata: metadata || null,
    environment: ENVIRONMENT,
  });
  if (insertError) logger.warn('Provisioning event write failed', { step, error: insertError.message });
}

function temporaryPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  const bytes = crypto.randomBytes(18);
  return Array.from(bytes, (byte) => chars[byte % chars.length]).join('');
}

function tenantSlug(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
  return `${base || 'organization'}-${crypto.randomBytes(4).toString('hex')}`;
}

async function findUserByEmail(supabase: Awaited<ReturnType<typeof requireAdminClient>>, email: string): Promise<AdminUserRecord | null> {
  const normalized = email.trim().toLowerCase();
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const users = (data?.users ?? []) as AdminUserRecord[];
    const match = users.find((user) => user.email?.toLowerCase() === normalized);
    if (match) return match;
    if (users.length < 100) break;
  }
  return null;
}

export async function provisionLicense(ctx: ProvisioningContext): Promise<ProvisioningResult> {
  const supabase = await requireAdminClient();
  const { correlationId, email, productId, paymentIntentId, sessionId, amountCents, currency } = ctx;
  const orgName = ctx.organizationName || `${email.split('@')[0]} Organization`;
  let purchaseId: string | undefined;
  let tenantId: string | undefined;
  let licenseId: string | undefined;
  let adminUserId: string | undefined;

  await setAuditContext(supabase, { systemActor: 'license_provisioning', requestId: correlationId });

  try {
    await logProvisioningEvent(correlationId, 'payment_received', 'completed', undefined, paymentIntentId, undefined, {
      email,
      product_id: productId,
      amount_cents: amountCents,
    });

    const { data: purchase, error: purchaseError } = await supabase
      .from('license_purchases')
      .insert({
        organization_name: orgName,
        contact_name: `${orgName} Admin`,
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
    if (purchaseError) throw purchaseError;
    purchaseId = purchase.id;
    await logProvisioningEvent(correlationId, 'purchase_created', 'completed', undefined, paymentIntentId);

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: orgName,
        slug: tenantSlug(orgName),
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
    if (tenantError) throw tenantError;
    tenantId = tenant.id;
    await supabase.from('license_purchases').update({ tenant_id: tenantId }).eq('id', purchaseId);
    await logProvisioningEvent(correlationId, 'tenant_created', 'completed', tenantId, paymentIntentId);

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
    if (licenseError) throw licenseError;
    licenseId = license.id;
    await supabase.from('license_purchases').update({ license_id: licenseId }).eq('id', purchaseId);
    await logProvisioningEvent(correlationId, 'license_created', 'completed', tenantId, paymentIntentId);

    const existingUser = await findUserByEmail(supabase, email);
    let generatedPassword: string | undefined;
    if (existingUser) {
      adminUserId = existingUser.id;
      await supabase.from('profiles').upsert({ id: adminUserId, email, tenant_id: tenantId, role: 'admin' }, { onConflict: 'id' });
    } else {
      generatedPassword = temporaryPassword();
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: generatedPassword,
        email_confirm: true,
        user_metadata: { tenant_id: tenantId, role: 'admin' },
      });
      if (createError || !created.user) throw createError || new Error('Admin user creation failed.');
      adminUserId = created.user.id;
      await supabase.from('profiles').upsert({
        id: adminUserId,
        email,
        tenant_id: tenantId,
        role: 'admin',
        full_name: `${orgName} Admin`,
      }, { onConflict: 'id' });
    }
    await logProvisioningEvent(correlationId, 'admin_created', 'completed', tenantId, paymentIntentId, undefined, {
      admin_user_id: adminUserId,
      new_user: Boolean(generatedPassword),
    });

    try {
      const { data: magicLink } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?redirect=${encodeURIComponent('/admin')}` },
      });
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.CRON_SECRET ?? '' },
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
            temporaryPassword: generatedPassword,
            supportEmail: 'info@elevateforhumanity.org',
          },
        }),
      });
      await logProvisioningEvent(correlationId, 'email_sent', 'completed', tenantId, paymentIntentId);
    } catch (emailError) {
      logger.error('Failed to send provisioning email', emailError as Error);
      await logProvisioningEvent(correlationId, 'email_sent', 'failed', tenantId, paymentIntentId, emailError instanceof Error ? emailError.message : 'Email failed');
    }

    await logAuditEvent({
      action: 'LICENSE_PROVISIONED',
      actor_id: adminUserId || 'system:license_provisioning',
      resourceType: 'license',
      resourceId: licenseId,
      metadata: { correlation_id: correlationId, tenant_id: tenantId, product_id: productId, payment_intent_id: paymentIntentId, amount_cents: amountCents },
    });
    await logProvisioningEvent(correlationId, 'completed', 'completed', tenantId, paymentIntentId);
    return { success: true, tenantId, licenseId, licenseKey, adminUserId };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Provisioning failed.';
    logger.error('License provisioning failed', error as Error);
    await logProvisioningEvent(correlationId, 'failed', 'failed', tenantId, paymentIntentId, message);
    await logAuditEvent({
      action: 'LICENSE_PROVISIONING_FAILED',
      actor_id: 'system:license_provisioning',
      resourceType: 'license',
      resourceId: licenseId || correlationId,
      metadata: { correlation_id: correlationId, tenant_id: tenantId, payment_intent_id: paymentIntentId },
    });
    try {
      if (licenseId) await supabase.from('licenses').delete().eq('id', licenseId);
      if (tenantId) await supabase.from('tenants').delete().eq('id', tenantId);
      if (purchaseId) await supabase.from('license_purchases').update({ status: 'failed' }).eq('id', purchaseId);
      await logProvisioningEvent(correlationId, 'rolled_back', 'rolled_back', tenantId, paymentIntentId);
    } catch (rollbackError) {
      logger.error('License provisioning rollback failed', rollbackError as Error);
    }
    return { success: false, error: message };
  }
}

export async function suspendLicense(tenantId: string, reason: string): Promise<void> {
  const supabase = await requireAdminClient();
  const correlationId = crypto.randomUUID();
  await setAuditContext(supabase, { systemActor: 'license_enforcement', requestId: correlationId });
  await supabase.from('tenants').update({ license_status: 'suspended' }).eq('id', tenantId);
  await supabase.from('licenses').update({ status: 'suspended' }).eq('tenant_id', tenantId);
  await logAuditEvent({
    action: 'LICENSE_SUSPENDED',
    actor_id: 'system:license_enforcement',
    resourceType: 'tenant',
    resourceId: tenantId,
    metadata: { reason, correlation_id: correlationId },
  });
}

export async function enforceSubscriptionStatus(subscriptionId: string): Promise<void> {
  const supabase = await requireAdminClient();
  const { data: tenant } = await supabase.from('tenants').select('id').eq('stripe_subscription_id', subscriptionId).maybeSingle();
  if (tenant) await suspendLicense(tenant.id, 'subscription_payment_failed');
}

export async function reactivateLicense(tenantId: string): Promise<void> {
  const supabase = await requireAdminClient();
  const correlationId = crypto.randomUUID();
  await setAuditContext(supabase, { systemActor: 'license_enforcement', requestId: correlationId });
  await supabase.from('tenants').update({ license_status: 'active' }).eq('id', tenantId);
  await supabase.from('licenses').update({ status: 'active' }).eq('tenant_id', tenantId);
  await logAuditEvent({
    action: 'LICENSE_REACTIVATED',
    actor_id: 'system:license_enforcement',
    resourceType: 'tenant',
    resourceId: tenantId,
    metadata: { correlation_id: correlationId },
  });
}
