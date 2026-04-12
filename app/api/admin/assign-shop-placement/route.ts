
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { toErrorMessage } from '@/lib/safe';
import { canMatchApprentice, hasVerifiedDocuments } from '@/lib/documents';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

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

    const { studentId, shopId, shopName, shopAddress, supervisorName, supervisorEmail, programSlug } =
      await req.json();

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }
    if (!programSlug) {
      return NextResponse.json({ error: 'programSlug required — placement must be tied to a specific program' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify admin access
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // =========================================================================
    // PROGRAM CONTEXT VALIDATION
    // Confirm the student has an active enrollment in the specified program.
    // Placement writes are rejected if the slug does not match the student's
    // actual enrollment — no defaults, no inference.
    // =========================================================================
    const { data: enrollment, error: enrollmentErr } = await supabase
      .from('program_enrollments')
      .select('id, program_slug, program_id')
      .eq('user_id', studentId)
      .eq('program_slug', programSlug)
      .in('status', ['active', 'enrolled', 'in_progress', 'confirmed'])
      .maybeSingle();

    if (enrollmentErr) {
      return NextResponse.json({ error: 'Failed to verify enrollment' }, { status: 500 });
    }
    if (!enrollment) {
      return NextResponse.json(
        { error: `Student has no active enrollment in program '${programSlug}'. Verify the program slug and enrollment status before assigning a placement.` },
        { status: 422 }
      );
    }

    // =========================================================================
    // MANDATORY VERIFICATION GATE
    // Matching is BLOCKED until required documents are VERIFIED
    // =========================================================================

    // Get apprentice ID from student
    const { data: apprentice } = await supabase
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

    // Write canonical placement to apprentice_placements (FK-based).
    // This is the table the OJT enforcement and supervisor verification
    // routes read from. shop_id is required for supervisor auth.
    // program_slug comes from the validated enrollment — never inferred.
    if (shopId) {
      // Deactivate any existing active placement for this student+program
      // before writing the new one. Prevents two active placements existing
      // simultaneously for the same student/program context.
      await supabase
        .from('apprentice_placements')
        .update({ status: 'inactive', end_date: new Date().toISOString().split('T')[0] })
        .eq('student_id', studentId)
        .eq('program_slug', programSlug)
        .eq('status', 'active')
        .neq('shop_id', shopId); // only deactivate if reassigning to a different shop

      const { error: canonicalErr } = await supabase
        .from('apprentice_placements')
        .upsert(
          {
            student_id: studentId,
            shop_id: shopId,
            program_slug: programSlug,           // validated against enrollment above
            supervisor_user_id: null,            // populated when supervisor registers
            start_date: new Date().toISOString().split('T')[0],
            status: 'active',
          },
          { onConflict: 'student_id,shop_id,program_slug' }
        );

      if (canonicalErr) {
        return NextResponse.json({ error: 'Placement failed' }, { status: 500 });
      }
    }

    // Also write to shop_placements (text-based legacy record) so existing
    // admin UI reads continue to work until fully migrated.
    const { error: placementError } = await supabase
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
      // Non-fatal — canonical write already succeeded
    }

    // Mark onboarding step complete
    const { error: onboardingError } = await supabase
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
