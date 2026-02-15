import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantContext, logAdminAccess } from '@/lib/tenant';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * STEP 5F: Admin license controls
 * 
 * Actions:
 * - PATCH: Update license (suspend, reactivate, update features/limits)
 * - DELETE: Revoke license
 * 
 * All actions require super_admin role and are audited.
 */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: licenseId } = await params;
    const tenantContext = await getTenantContext();
    const supabase = await createClient();

    // Verify super_admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', tenantContext.userId)
      .single();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action, reason, features, limits } = body;

    // Get license to find tenant_id for audit
    const { data: license } = await supabase
      .from('licenses')
      .select('tenant_id, status')
      .eq('id', licenseId)
      .single();

    if (!license) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 });
    }

    let result;

    switch (action) {
      case 'suspend':
        if (!reason) {
          return NextResponse.json({ error: 'Reason required for suspension' }, { status: 400 });
        }
        result = await supabase.rpc('suspend_license', {
          p_license_id: licenseId,
          p_reason: reason,
          p_admin_user_id: tenantContext.userId,
        });
        break;

      case 'reactivate':
        result = await supabase.rpc('reactivate_license', {
          p_license_id: licenseId,
          p_admin_user_id: tenantContext.userId,
        });
        break;

      case 'update_features':
        result = await supabase
          .from('licenses')
          .update({ features, updated_at: new Date().toISOString() })
          .eq('id', licenseId);
        
        // Log feature update
        await logAdminAccess(
          license.tenant_id,
          'update_license_features',
          'licenses',
          `Updated features: ${JSON.stringify(features)}`
        );
        break;

      case 'update_limits':
        result = await supabase
          .from('licenses')
          .update({ 
            max_users: limits.max_users,
            max_students: limits.max_students,
            max_programs: limits.max_programs,
            updated_at: new Date().toISOString(),
          })
          .eq('id', licenseId);
        
        await logAdminAccess(
          license.tenant_id,
          'update_license_limits',
          'licenses',
          `Updated limits: ${JSON.stringify(limits)}`
        );
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (result?.error) {
      logger.error('Admin license action failed', result.error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    logger.info('Admin license action completed', { 
      action, 
      licenseId, 
      adminUserId: tenantContext.userId 
    });

    return NextResponse.json({ success: true, action });
  } catch (error) {
    logger.error('Admin license endpoint error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE: Revoke license (permanent)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: licenseId } = await params;
    const tenantContext = await getTenantContext();
    const supabase = await createClient();

    // Verify super_admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', tenantContext.userId)
      .single();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const reason = searchParams.get('reason');

    if (!reason) {
      return NextResponse.json({ error: 'Reason required for revocation' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('revoke_license', {
      p_license_id: licenseId,
      p_reason: reason,
      p_admin_user_id: tenantContext.userId,
    });

    if (error) {
      logger.error('License revocation failed', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    logger.info('License revoked', { 
      licenseId, 
      reason, 
      adminUserId: tenantContext.userId 
    });

    return NextResponse.json({ success: true, revoked: data });
  } catch (error) {
    logger.error('License revocation endpoint error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
