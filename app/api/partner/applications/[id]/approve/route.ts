import { logger } from '@/lib/logger';

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

/**
 * Partner Approval - Two-Phase Atomic Flow
 * 
 * Phase 1: rpc_approve_partner (DB-only)
 *   - Creates partner entity
 *   - Creates program access
 *   - Updates application status to approved_pending_user
 *   - All atomic, no partial writes
 * 
 * Phase 2: Auth user creation + rpc_link_partner_user
 *   - Creates auth user via Supabase Admin API
 *   - Links auth user to partner via RPC
 *   - Finalizes approval status to approved
 * 
 * If Phase 2 fails, partner remains in approved_pending_user state
 * and can be retried without duplicating Phase 1 work.
 */
async function _POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const { id: applicationId } = await params;
  const supabase = createAdminClient();
  
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  try {
    // Get admin user for audit trail
    const userSupabase = await createClient();
    const { data: { user: adminUser } } = await userSupabase.auth.getUser();
    
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', adminUser.id)
      .single();

    if (!adminProfile || !['admin', 'super_admin'].includes(adminProfile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get application for email
    const { data: application } = await supabase
      .from('partner_applications')
      .select('contact_email, owner_name, programs_requested')
      .eq('id', applicationId)
      .single();

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const partnerEmail = application.contact_email;
    const idempotencyKey = `approve-${applicationId}-${Date.now()}`;

    // ========================================
    // PHASE 1: DB-Only Approval (Atomic RPC)
    // ========================================
    const { data: approveResult, error: approveError } = await supabase.rpc('rpc_approve_partner', {
      p_partner_application_id: applicationId,
      p_admin_user_id: adminUser.id,
      p_partner_email: partnerEmail,
      p_program_ids: null, // Use programs from application
      p_idempotency_key: idempotencyKey,
    });

    if (approveError) {
      logger.error('Phase 1 RPC error', undefined, { detail: approveError.message });
      return NextResponse.json({ 
        error: 'Approval failed' 
      }, { status: 500 });
    }

    if (!approveResult?.success) {
      // Handle idempotent case
      if (approveResult?.idempotent) {
        // Already approved, continue to Phase 2
      } else {
        return NextResponse.json({ 
          error: approveResult?.message || 'Approval failed',
          code: approveResult?.code
        }, { status: 400 });
      }
    }

    const partnerId = approveResult.partner_id;

    // ========================================
    // PHASE 2: Auth User Creation
    // ========================================
    let authUserId: string | null = null;
    let loginLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org'}/login`;

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      u => u.email?.toLowerCase() === partnerEmail.toLowerCase()
    );

    if (existingUser) {
      authUserId = existingUser.id;
    } else {
      // Create new auth user
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: partnerEmail,
        email_confirm: true,
        user_metadata: {
          full_name: application.owner_name,
          partner_id: partnerId,
        },
      });

      if (createUserError) {
        logger.error('Auth user creation failed:', createUserError);
        // Partner is in approved_pending_user state - can retry later
        return NextResponse.json({
          success: true,
          partnerId,
          status: 'approved_pending_user',
          message: 'Partner approved but user creation failed. Retry needed.',
          error: 'User creation failed',
        }, { status: 207 }); // 207 Multi-Status
      }

      authUserId = newUser?.user?.id || null;
    }

    if (!authUserId) {
      return NextResponse.json({
        success: true,
        partnerId,
        status: 'approved_pending_user',
        message: 'Partner approved but no auth user ID available.',
      }, { status: 207 });
    }

    // ========================================
    // PHASE 2: Link Auth User (Atomic RPC)
    // ========================================
    const linkIdempotencyKey = `link-${partnerId}-${authUserId}`;
    
    const { data: linkResult, error: linkError } = await supabase.rpc('rpc_link_partner_user', {
      p_partner_id: partnerId,
      p_auth_user_id: authUserId,
      p_email: partnerEmail,
      p_idempotency_key: linkIdempotencyKey,
    });

    if (linkError) {
      logger.error('Phase 2 RPC error:', linkError);
      return NextResponse.json({
        success: true,
        partnerId,
        status: 'approved_pending_user',
        message: 'Partner approved but user linking failed. Retry needed.',
        error: 'Operation failed',
      }, { status: 207 });
    }

    if (!linkResult?.success && !linkResult?.idempotent) {
      return NextResponse.json({
        success: true,
        partnerId,
        status: 'approved_pending_user',
        message: linkResult?.message || 'User linking failed',
      }, { status: 207 });
    }

    // ========================================
    // PHASE 3: Generate Magic Link & Send Email
    // ========================================
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
    
    const { data: magicLinkData } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: partnerEmail,
      options: {
        // ?next= is read by /auth/callback and takes priority over role-based routing.
        // Without it, partners land on /program-holder/dashboard (role default) instead
        // of their dedicated portal.
        redirectTo: `${siteUrl}/auth/callback?next=/partner/dashboard`,
      },
    });

    if (magicLinkData?.properties?.action_link) {
      loginLink = magicLinkData.properties.action_link;
    }

    // Queue approval email (non-blocking)
    await supabase.from('notification_outbox').insert({
      to_email: partnerEmail,
      template_key: 'partner_approved',
      template_data: {
        owner_name: application.owner_name,
        login_link: loginLink,
        partner_id: partnerId,
      },
      status: 'queued',
      scheduled_for: new Date().toISOString(),
    }).catch(err => {
      logger.warn('Failed to queue approval email:', err);
    });

    // ========================================
    // SUCCESS
    // ========================================
    return NextResponse.json({
      success: true,
      partnerId,
      status: 'approved',
      message: 'Partner fully approved and user linked',
    });

  } catch (error) {
    logger.error('Partner approval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/partner/applications/[id]/approve', _POST);
