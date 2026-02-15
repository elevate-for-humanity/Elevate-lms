import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { auditLog } from '@/lib/auditLog';
import * as crypto from 'node:crypto';

interface TenantProvisioningResult {
  success: boolean;
  tenantId?: string;
  adminUserId?: string;
  temporaryPassword?: string;
  error?: string;
}

interface ProvisionTenantParams {
  email: string;
  organizationName?: string;
  productId: string;
  licenseId: string;
  stripeEventId?: string;
}

/**
 * Generate a secure temporary password
 */
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  const randomBytes = crypto.randomBytes(16);
  for (let i = 0; i < 16; i++) {
    password += chars[randomBytes[i] % chars.length];
  }
  return password;
}

/**
 * Generate a slug from organization name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

/**
 * Provision a new tenant after license purchase
 * Creates: tenant record, admin user, sends credentials
 */
export async function provisionTenant(params: ProvisionTenantParams): Promise<TenantProvisioningResult> {
  const { email, organizationName, productId, licenseId, stripeEventId } = params;
  const supabase = createAdminClient();

  try {
    // Check if tenant already exists for this email
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, tenant_id')
      .eq('email', email)
      .single();

    if (existingProfile?.tenant_id) {
      logger.info('Tenant already exists for email', { email, tenantId: existingProfile.tenant_id });
      return {
        success: true,
        tenantId: existingProfile.tenant_id,
        adminUserId: existingProfile.id,
      };
    }

    // Generate organization name if not provided
    const orgName = organizationName || email.split('@')[0] + ' Organization';
    const slug = generateSlug(orgName);

    // Create tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: orgName,
        slug: slug,
        settings: {
          product_id: productId,
          license_id: licenseId,
          provisioned_at: new Date().toISOString(),
        },
      })
      .select('id')
      .single();

    if (tenantError || !tenant) {
      logger.error('Failed to create tenant', tenantError);
      return { success: false, error: 'Failed to create tenant' };
    }

    // Update license with tenant_id
    await supabase
      .from('licenses')
      .update({ tenant_id: tenant.id })
      .eq('id', licenseId);

    // Check if user already exists in auth
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email);

    let adminUserId: string;
    let temporaryPassword: string | undefined;

    if (existingUser?.user) {
      // User exists - update their profile with tenant
      adminUserId = existingUser.user.id;
      
      await supabase
        .from('profiles')
        .update({
          tenant_id: tenant.id,
          role: 'admin',
        })
        .eq('id', adminUserId);

    } else {
      // Create new admin user
      temporaryPassword = generateTemporaryPassword();

      const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          tenant_id: tenant.id,
          role: 'admin',
        },
      });

      if (userError || !newUser.user) {
        logger.error('Failed to create admin user', userError);
        // Rollback tenant creation
        await supabase.from('tenants').delete().eq('id', tenant.id);
        return { success: false, error: 'Failed to create admin user' };
      }

      adminUserId = newUser.user.id;

      // Create profile for new user
      await supabase.from('profiles').insert({
        id: adminUserId,
        email,
        tenant_id: tenant.id,
        role: 'admin',
        full_name: orgName + ' Admin',
      });
    }

    // Audit log the provisioning
    await auditLog({
      action: 'CREATE',
      entity: 'tenant',
      entity_id: tenant.id,
      metadata: {
        email,
        organization_name: orgName,
        product_id: productId,
        license_id: licenseId,
        stripe_event_id: stripeEventId,
        admin_user_id: adminUserId,
        new_user_created: !!temporaryPassword,
      },
    });

    // Send welcome email with credentials
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: 'Your Elevate Platform is Ready',
          template: 'tenant-provisioned',
          data: {
            organizationName: orgName,
            email,
            temporaryPassword,
            loginUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
            adminUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/admin`,
            needsPasswordReset: !!temporaryPassword,
          },
        }),
      });
    } catch (emailError) {
      logger.error('Failed to send provisioning email', emailError as Error);
      // Don't fail provisioning if email fails
    }

    logger.info('Tenant provisioned successfully', {
      tenantId: tenant.id,
      adminUserId,
      email,
    });

    return {
      success: true,
      tenantId: tenant.id,
      adminUserId,
      temporaryPassword,
    };

  } catch (error) {
    logger.error('Tenant provisioning failed', error as Error);
    return {
      success: false,
      error: 'Operation failed',
    };
  }
}

/**
 * Check if a license has been provisioned
 */
export async function isLicenseProvisioned(licenseId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('licenses')
    .select('tenant_id')
    .eq('id', licenseId)
    .single();
  
  return !!data?.tenant_id;
}
