import { logger } from '@/lib/logger';
/**
 * Shared license-linking logic for Stripe webhooks.
 * Called by both /api/license/webhook and /api/licenses/webhook.
 */

import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/client';
import { createAdminClient, getAdminClient } from '@/lib/supabase/admin';

import { logAuditEvent } from '@/lib/audit';
import { setAuditContext } from '@/lib/audit-context';

export interface LinkingMetadata {
  license_id?: string;
  tenant_id?: string;
  license_type?: string;
  plan_id?: string;
}

export interface LinkResult {
  success: boolean;
  license_id?: string;
  tenant_id?: string;
  error?: string;
}

/**
 * Link a Stripe checkout/subscription to a license row.
 * Priority: license_id > tenant_id > stripe_subscription_id
 */
export async function linkStripeToLicense(
  eventId: string,
  customerId: string | null,
  subscriptionId: string | null,
  metadata: LinkingMetadata,
  currentPeriodEnd?: string
): Promise<LinkResult> {
  const supabase = await getAdminClient();
  
  if (!supabase) {
    logger.error('[linkStripeToLicense] Supabase admin client not available');
    return { success: false, error: 'Database connection failed' };
  }

  await setAuditContext(supabase, { systemActor: 'stripe_license_linker', requestId: eventId });
  
  logger.info('[linkStripeToLicense] Starting with:', { eventId, customerId, subscriptionId, metadata });
  const { license_id, tenant_id } = metadata;

  const updateData: Record<string, any> = {
    status: 'active',
    updated_at: new Date().toISOString(),
  };
  
  // Only set stripe fields if they have values
  if (customerId) {
    updateData.stripe_customer_id = customerId;
  }
  if (subscriptionId) {
    updateData.stripe_subscription_id = subscriptionId;
  }
  if (currentPeriodEnd) {
    updateData.current_period_end = currentPeriodEnd;
  }
  
  logger.info('[linkStripeToLicense] Update data:', updateData);

  // PRIORITY 1: Update by license_id
  if (license_id) {
    const { data, error } = await supabase
      .from('licenses')
      .update(updateData)
      .eq('id', license_id)
      .select('id, tenant_id')
      .single();

    if (!error && data) {
      const result = {
        success: true,
        license_id: data.id,
        tenant_id: data.tenant_id || tenant_id,
      };
      logLinkingProof(eventId, result, customerId, subscriptionId);
      await updateTenant(supabase, data.tenant_id || tenant_id, customerId, subscriptionId);
      return result;
    }
  }

  // PRIORITY 2: Update by tenant_id
  if (tenant_id) {
    const { data, error } = await supabase
      .from('licenses')
      .update(updateData)
      .eq('tenant_id', tenant_id)
      .select('id, tenant_id')
      .single();

    if (!error && data) {
      const result = {
        success: true,
        license_id: data.id,
        tenant_id: data.tenant_id,
      };
      logLinkingProof(eventId, result, customerId, subscriptionId);
      await updateTenant(supabase, tenant_id, customerId, subscriptionId);
      return result;
    }
  }

  // PRIORITY 3: Update by stripe_subscription_id (fallback)
  if (subscriptionId) {
    const { data, error } = await supabase
      .from('licenses')
      .update(updateData)
      .eq('stripe_subscription_id', subscriptionId)
      .select('id, tenant_id')
      .single();

    if (!error && data) {
      const result = {
        success: true,
        license_id: data.id,
        tenant_id: data.tenant_id,
      };
      logLinkingProof(eventId, result, customerId, subscriptionId);
      return result;
    }
  }

  return {
    success: false,
    error: 'No license found to update',
  };
}

/**
 * Handle checkout.session.completed event
 */
export async function handleCheckoutCompleted(
  event: Stripe.Event,
  session: Stripe.Checkout.Session
): Promise<LinkResult> {
  const metadata: LinkingMetadata = {
    license_id: session.metadata?.license_id,
    tenant_id: session.metadata?.tenant_id,
    license_type: session.metadata?.license_type,
    plan_id: session.metadata?.plan_id,
  };

  // Skip if not a license purchase
  if (!metadata.license_type && !metadata.plan_id) {
    return { success: false, error: 'Not a license purchase' };
  }

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string | null;

  // Get current_period_end from subscription
  let currentPeriodEnd: string | undefined;
  if (subscriptionId) {
    try {
      const stripe = getStripe();
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
    } catch (e) {
      logger.warn('Could not retrieve subscription:', e);
    }
  }

  return linkStripeToLicense(event.id, customerId, subscriptionId, metadata, currentPeriodEnd);
}

/**
 * Handle invoice.paid event
 */
export async function handleInvoicePaid(
  event: Stripe.Event,
  invoice: Stripe.Invoice
): Promise<LinkResult> {
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string | null;

  if (!subscriptionId) {
    return { success: false, error: 'No subscription on invoice' };
  }

  // Get metadata from subscription
  let metadata: LinkingMetadata = {};
  try {
    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    metadata = {
      license_id: subscription.metadata?.license_id,
      tenant_id: subscription.metadata?.tenant_id,
    };
  } catch (e) {
    logger.warn('Could not retrieve subscription metadata:', e);
  }

  const currentPeriodEnd = new Date(invoice.period_end * 1000).toISOString();

  return linkStripeToLicense(event.id, customerId, subscriptionId, metadata, currentPeriodEnd);
}

/**
 * Handle customer.subscription.updated event
 */
export async function handleSubscriptionUpdated(
  event: Stripe.Event,
  subscription: Stripe.Subscription
): Promise<LinkResult> {
  const metadata: LinkingMetadata = {
    license_id: subscription.metadata?.license_id,
    tenant_id: subscription.metadata?.tenant_id,
  };

  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();

  const supabase = await getAdminClient();
  await setAuditContext(supabase, { systemActor: 'stripe_subscription_handler', requestId: event.id });

  const status = mapSubscriptionStatus(subscription.status);

  const updateData = {
    status,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    current_period_end: currentPeriodEnd,
    updated_at: new Date().toISOString(),
  };

  // Try by license_id first
  if (metadata.license_id) {
    const { data } = await supabase
      .from('licenses')
      .update(updateData)
      .eq('id', metadata.license_id)
      .select('id, tenant_id')
      .single();
    if (data) {
      return { success: true, license_id: data.id, tenant_id: data.tenant_id };
    }
  }

  // Try by tenant_id
  if (metadata.tenant_id) {
    const { data } = await supabase
      .from('licenses')
      .update(updateData)
      .eq('tenant_id', metadata.tenant_id)
      .select('id, tenant_id')
      .single();
    if (data) {
      return { success: true, license_id: data.id, tenant_id: data.tenant_id };
    }
  }

  // Fallback to subscription_id
  const { data } = await supabase
    .from('licenses')
    .update(updateData)
    .eq('stripe_subscription_id', subscriptionId)
    .select('id, tenant_id')
    .single();

  if (data) {
    return { success: true, license_id: data.id, tenant_id: data.tenant_id };
  }

  return { success: false, error: 'No license found' };
}

/**
 * Handle customer.subscription.deleted event
 */
export async function handleSubscriptionDeleted(
  event: Stripe.Event,
  subscription: Stripe.Subscription
): Promise<LinkResult> {
  const supabase = await getAdminClient();
  const subscriptionId = subscription.id;

  const { data } = await supabase
    .from('licenses')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId)
    .select('id, tenant_id')
    .single();

  if (data) {
    return { success: true, license_id: data.id, tenant_id: data.tenant_id };
  }

  return { success: false, error: 'No license found' };
}

/**
 * Handle invoice.payment_failed event
 */
export async function handlePaymentFailed(
  event: Stripe.Event,
  invoice: Stripe.Invoice
): Promise<LinkResult> {
  const subscriptionId = invoice.subscription as string | null;
  if (!subscriptionId) {
    return { success: false, error: 'No subscription on invoice' };
  }

  const supabase = await getAdminClient();

  const { data } = await supabase
    .from('licenses')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId)
    .select('id, tenant_id')
    .single();

  if (data) {
    return { success: true, license_id: data.id, tenant_id: data.tenant_id };
  }

  return { success: false, error: 'No license found' };
}

// Helper: Update tenant with Stripe IDs
async function updateTenant(
  supabase: ReturnType<typeof createAdminClient>,
  tenantId: string | undefined,
  customerId: string,
  subscriptionId: string | null
): Promise<void> {
  if (!tenantId) return;
  await supabase
    .from('tenants')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      license_status: 'active',
    })
    .eq('id', tenantId);
}

// Helper: Log linking proof
function logLinkingProof(
  eventId: string,
  result: LinkResult,
  customerId: string,
  subscriptionId: string | null
): void {
  logger.info(JSON.stringify({
    event: 'LICENSE_LINKED',
    event_id: eventId,
    license_id: result.license_id,
    tenant_id: result.tenant_id,
    customer_id: customerId,
    subscription_id: subscriptionId,
  }));
}

// Helper: Map Stripe subscription status to license status
function mapSubscriptionStatus(stripeStatus: string): string {
  const statusMap: Record<string, string> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'suspended',
    incomplete: 'pending',
    incomplete_expired: 'canceled',
    trialing: 'trial',
    paused: 'suspended',
  };
  return statusMap[stripeStatus] || 'active';
}
