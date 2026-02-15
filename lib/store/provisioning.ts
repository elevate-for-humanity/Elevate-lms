import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { generateLicenseKey, hashLicenseKey } from '@/lib/store/license';
import { logProvisioningStep } from '@/lib/store/audit';

export interface ProvisioningInput {
  purchaseId: string;
  paymentIntentId: string;
  organizationName: string;
  contactName: string;
  contactEmail: string;
  licenseType: 'single' | 'school' | 'enterprise';
  productSlug?: string;
}

export interface ProvisioningResult {
  success: boolean;
  tenantId?: string;
  licenseKey?: string;
  adminUserId?: string;
  error?: string;
}

/**
 * SECTION 3: Transactional provisioning
 * All-or-nothing: tenant, license, admin user
 * On ANY failure: rollback everything
 */
export async function provisionLicense(
  adminSupabase: SupabaseClient,
  input: ProvisioningInput
): Promise<ProvisioningResult> {
  const correlationId = input.paymentIntentId;
  let tenantId: string | undefined;
  let licenseId: string | undefined;
  let adminUserId: string | undefined;

  try {
    // Step 1: Create tenant
    await logProvisioningStep(adminSupabase, {
      correlationId,
      paymentIntentId: input.paymentIntentId,
      step: 'tenant_created',
      status: 'started',
    });

    const slug = generateSlug(input.organizationName);
    const { data: tenant, error: tenantError } = await adminSupabase
      .from('tenants')
      .insert({
        name: input.organizationName,
        slug,
        status: 'active',
      })
      .select()
      .single();

    if (tenantError || !tenant) {
      throw new Error(`Failed to create tenant: ${tenantError?.message}`);
    }

    tenantId = tenant.id;

    await logProvisioningStep(adminSupabase, {
      tenantId,
      correlationId,
      paymentIntentId: input.paymentIntentId,
      step: 'tenant_created',
      status: 'completed',
    });

    // Step 2: Generate and store license
    await logProvisioningStep(adminSupabase, {
      tenantId,
      correlationId,
      paymentIntentId: input.paymentIntentId,
      step: 'license_created',
      status: 'started',
    });

    const licenseKey = generateLicenseKey();
    const licenseKeyHash = hashLicenseKey(licenseKey);

    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);

    const features = getFeatures(input.licenseType);
    const maxUsers = getMaxUsers(input.licenseType);
    const maxDeployments = getMaxDeployments(input.licenseType);

    const { data: license, error: licenseError } = await adminSupabase
      .from('licenses')
      .insert({
        license_key: licenseKeyHash,
        domain: 'pending-setup',
        customer_email: input.contactEmail,
        tenant_id: tenantId,
        tier: mapLicenseTypeToTier(input.licenseType),
        status: 'active',
        max_users: maxUsers,
        max_deployments: maxDeployments,
        features,
        expires_at: validUntil.toISOString(),
        metadata: {
          product_slug: input.productSlug,
          organization_name: input.organizationName,
          purchased_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (licenseError || !license) {
      throw new Error(`Failed to create license: ${licenseError?.message}`);
    }

    licenseId = license.id;

    await logProvisioningStep(adminSupabase, {
      tenantId,
      correlationId,
      paymentIntentId: input.paymentIntentId,
      step: 'license_created',
      status: 'completed',
    });

    // Step 3: Create admin user
    await logProvisioningStep(adminSupabase, {
      tenantId,
      correlationId,
      paymentIntentId: input.paymentIntentId,
      step: 'admin_created',
      status: 'started',
    });

    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: input.contactEmail,
      email_confirm: true,
      user_metadata: {
        full_name: input.contactName,
        tenant_id: tenantId,
        role: 'tenant_admin',
      },
    });

    if (authError) {
      // User might already exist - try to get them
      const { data: existingUsers } = await adminSupabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === input.contactEmail);
      
      if (existingUser) {
        adminUserId = existingUser.id;
        // Update their metadata to include this tenant
        await adminSupabase.auth.admin.updateUserById(existingUser.id, {
          user_metadata: {
            ...existingUser.user_metadata,
            tenant_id: tenantId,
            role: 'tenant_admin',
          },
        });
      } else {
        throw new Error(`Failed to create admin user: ${authError.message}`);
      }
    } else {
      adminUserId = authData.user.id;
    }

    // Create profile for admin
    await adminSupabase.from('profiles').upsert({
      id: adminUserId,
      email: input.contactEmail,
      full_name: input.contactName,
      role: 'tenant_admin',
      tenant_id: tenantId,
    });

    await logProvisioningStep(adminSupabase, {
      tenantId,
      correlationId,
      paymentIntentId: input.paymentIntentId,
      step: 'admin_created',
      status: 'completed',
      metadata: { adminUserId },
    });

    // Step 4: Update purchase record
    await adminSupabase
      .from('license_purchases')
      .update({
        tenant_id: tenantId,
        status: 'provisioned',
      })
      .eq('id', input.purchaseId);

    return {
      success: true,
      tenantId,
      licenseKey, // Return unhashed key for email
      adminUserId,
    };

  } catch (error) {
    const errorMessage = 'Operation failed';
    logger.error('Provisioning failed', { error: errorMessage, correlationId });

    // Log failure
    await logProvisioningStep(adminSupabase, {
      tenantId,
      correlationId,
      paymentIntentId: input.paymentIntentId,
      step: 'provisioning_failed',
      status: 'failed',
      error: errorMessage,
    });

    // ROLLBACK: Delete created resources
    if (licenseId) {
      await adminSupabase.from('licenses').delete().eq('id', licenseId);
    }
    if (tenantId) {
      await adminSupabase.from('tenants').delete().eq('id', tenantId);
    }
    if (adminUserId) {
      await adminSupabase.auth.admin.deleteUser(adminUserId);
    }

    // Mark purchase as failed
    await adminSupabase
      .from('license_purchases')
      .update({ status: 'failed' })
      .eq('id', input.purchaseId);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Helper functions
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Date.now().toString(36);
}

function mapLicenseTypeToTier(licenseType: string): string {
  switch (licenseType) {
    case 'single': return 'basic';
    case 'school': return 'pro';
    case 'enterprise': return 'enterprise';
    default: return 'basic';
  }
}

function getMaxUsers(licenseType: string): number {
  switch (licenseType) {
    case 'single': return 100;
    case 'school': return 1000;
    case 'enterprise': return 999999;
    default: return 100;
  }
}

function getMaxDeployments(licenseType: string): number {
  switch (licenseType) {
    case 'single': return 1;
    case 'school': return 3;
    case 'enterprise': return 999;
    default: return 1;
  }
}

function getFeatures(licenseType: string): string[] {
  const baseFeatures = ['lms', 'enrollment', 'admin', 'payments', 'mobile-app'];

  switch (licenseType) {
    case 'single':
      return baseFeatures;
    case 'school':
      return [...baseFeatures, 'partner-dashboard', 'case-management', 'compliance', 'white-label'];
    case 'enterprise':
      return [...baseFeatures, 'partner-dashboard', 'case-management', 'employer-portal', 'compliance', 'white-label', 'ai-tutor', 'api-access'];
    default:
      return baseFeatures;
  }
}
