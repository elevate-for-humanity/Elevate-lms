import { createAdminClient as createSupabaseClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { ProvisioningJob } from '../queue';

import { logAuditEvent } from '@/lib/audit';
import { setAuditContext } from '@/lib/audit-context';

/**
 * STEP 6A: License provision job handler
 * 
 * Creates or activates a license for a tenant
 */
export async function processLicenseProvision(job: ProvisioningJob): Promise<void> {
  const supabase = createSupabaseClient();
  await setAuditContext(supabase, { systemActor: 'license_provision_job', requestId: job.correlation_id });
  const { tenantId, plan, stripeCustomerId, stripeSubscriptionId } = job.payload as {
    tenantId: string;
    plan: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };
  
  if (!tenantId || !plan) {
    throw new Error('Missing required fields: tenantId, plan');
  }
  
  // Check if license already exists
  const { data: existing } = await supabase
    .from('licenses')
    .select('id')
    .eq('tenant_id', tenantId)
    .single();
  
  if (existing) {
    // Update existing license
    const { error } = await supabase
      .from('licenses')
      .update({
        status: 'active',
        plan,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    
    if (error) throw error;
    
    logger.info('License updated', { 
      licenseId: existing.id, 
      correlationId: job.correlation_id 
    });
  } else {
    // Create new license
    const { error } = await supabase
      .from('licenses')
      .insert({
        tenant_id: tenantId,
        plan,
        status: 'active',
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        features: getDefaultFeatures(plan),
      });
    
    if (error) throw error;
    
    logger.info('License created', { 
      tenantId, 
      plan, 
      correlationId: job.correlation_id 
    });
  }
  
  // Log provisioning event
  await supabase.from('provisioning_events').insert({
    correlation_id: job.correlation_id,
    tenant_id: tenantId,
    payment_intent_id: job.payment_intent_id,
    step: 'license_provisioned',
    status: 'completed',
    metadata: { plan, jobId: job.id },
  });
}

function getDefaultFeatures(plan: string): Record<string, boolean> {
  const features: Record<string, Record<string, boolean>> = {
    trial: {
      ai_features: false,
      white_label: false,
      custom_domain: false,
      api_access: false,
      advanced_reporting: false,
      bulk_operations: false,
      sso: false,
      priority_support: false,
    },
    basic: {
      ai_features: false,
      white_label: false,
      custom_domain: false,
      api_access: true,
      advanced_reporting: false,
      bulk_operations: false,
      sso: false,
      priority_support: false,
    },
    professional: {
      ai_features: true,
      white_label: true,
      custom_domain: false,
      api_access: true,
      advanced_reporting: true,
      bulk_operations: true,
      sso: false,
      priority_support: true,
    },
    enterprise: {
      ai_features: true,
      white_label: true,
      custom_domain: true,
      api_access: true,
      advanced_reporting: true,
      bulk_operations: true,
      sso: true,
      priority_support: true,
    },
  };
  
  return features[plan] || features.basic;
}
