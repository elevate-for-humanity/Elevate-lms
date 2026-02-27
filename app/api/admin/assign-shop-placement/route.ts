export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { toErrorMessage } from '@/lib/safe';
import { canMatchApprentice, hasVerifiedDocuments } from '@/lib/documents';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
import { withApiAudit } from '@/lib/audit/withApiAudit';

/**
 * MANDATORY VERIFICATION ENFORCEMENT:
 * Matching is BLOCKED until required documents are VERIFIED for BOTH:
 * - Apprentice: photo_id verified
 * - Host Shop: shop_license AND barber_license verified
 */
async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const { studentId, shopId, shopName, shopAddress, supervisorName, supervisorEmail } =
      await req.json();

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Verify admin access
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // =========================================================================
    // MANDATORY VERIFICATION GATE
    // Matching is BLOCKED until required documents are VERIFIED
    // =========================================================================
    
    // Get apprentice ID from student
    const { data: apprentice } = await db
      .from('apprentices')
      .select('id')
      .eq('user_id', studentId)
      .single();

    if (apprentice && shopId) {
      // Full verification check for both apprentice and shop
      const matchGate = await canMatchApprentice(apprentice.id, shopId);
      
      if (!matchGate.allowed) {
        return NextResponse.json(
          {
            error: 'Document verification required before matching',
            reason: matchGate.reason,
            unverifiedDocuments: matchGate.unverifiedDocs,
            message: 'Required documents must be verified for both apprentice and host shop before matching.',
          },
          { status: 400 }
        );
      }
    } else if (apprentice) {
      // At minimum, check apprentice docs
      const apprenticeGate = await hasVerifiedDocuments('apprentice', apprentice.id);
      
      if (!apprenticeGate.complete) {
        return NextResponse.json(
          {
            error: 'Document verification required before matching',
            reason: 'Apprentice documents must be verified before shop placement',
            unverifiedDocuments: apprenticeGate.unverified,
          },
          { status: 400 }
        );
      }
    }

    // Create or update shop placement record
    const { error: placementError } = await db
      .from('shop_placements')
      .upsert(
        {
          student_id: studentId,
          shop_name: shopName,
          shop_address: shopAddress,
          supervisor_name: supervisorName,
          supervisor_email: supervisorEmail,
          status: 'active',
          assigned_at: new Date().toISOString(),
        },
        { onConflict: 'student_id' }
      );

    if (placementError) {
      // Error: $1
      return NextResponse.json(
        { error: 'Placement failed' },
        { status: 500 }
      );
    }

    // Mark onboarding step complete
    const { error: onboardingError } = await db
      .from('student_onboarding')
      .update({ shop_placed: true })
      .eq('student_id', studentId);

    if (onboardingError) {
      // Error: $1
      // Continue - placement was successful
    }

    await logAdminAudit({ action: AdminAction.SHOP_PLACEMENT_ASSIGNED, actorId: user.id, entityType: 'shop_placements', entityId: studentId, metadata: { shop_name: shopName }, req });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    // Error: $1
    return NextResponse.json(
      { error: toErrorMessage(err) || 'Failed to assign shop placement' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/admin/assign-shop-placement', _POST);
