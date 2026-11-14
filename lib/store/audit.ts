import type { SupabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export type ProvisioningStep =
  | 'payment_received'
  | 'tenant_created'
  | 'license_created'
  | 'admin_created'
  | 'email_sent'
  | 'provisioning_failed';

export type ProvisioningStatus = 'started' | 'completed' | 'failed';

interface ProvisioningLogEntry {
  tenantId?: string;
  paymentIntentId?: string;
  correlationId: string;
  step: ProvisioningStep;
  status: ProvisioningStatus;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log a provisioning step to the audit table
 */
export async function logProvisioningStep(
  supabase: SupabaseClient,
  entry: ProvisioningLogEntry,
): Promise<void> {
  try {
    const { error } = await supabase.from('provisioning_events').insert({
      tenant_id: entry.tenantId,
      payment_intent_id: entry.paymentIntentId,
      correlation_id: entry.correlationId,
      step: entry.step,
      status: entry.status,
      error: entry.error,
      metadata: entry.metadata || {},
    });

    if (error) {
      logger.error('Failed to log provisioning step', error);
    }
  } catch (err) {
    // Don't throw - audit logging should not break provisioning
    logger.error('Audit logging error', err as Error);
  }
}

/**
 * Get provisioning history for a payment
 */
export async function getProvisioningHistory(
  supabase: SupabaseClient,
  paymentIntentId: string,
): Promise<ProvisioningLogEntry[]> {
  const { data, error } = await supabase
    .from('provisioning_events')
    .select('*')
    .eq('payment_intent_id', paymentIntentId)
    .order('created_at', { ascending: true });

  if (error) {
    logger.error('Failed to get provisioning history', error);
    return [];
  }

  return data || [];
}

/**
 * Check if provisioning completed successfully
 */
export async function isProvisioningComplete(
  supabase: SupabaseClient,
  paymentIntentId: string,
): Promise<boolean> {
  const history = await getProvisioningHistory(supabase, paymentIntentId);

  const requiredSteps: ProvisioningStep[] = [
    'payment_received',
    'tenant_created',
    'license_created',
    'admin_created',
    'email_sent',
  ];

  const completedSteps = history.filter((e) => e.status === 'completed').map((e) => e.step);

  return requiredSteps.every((step) => completedSteps.includes(step));
}
