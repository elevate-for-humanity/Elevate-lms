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

const SUPERVISOR_MEMBERSHIP_ROLES = new Set([
  'owner',
  'partner_admin',
  'admin',
  'supervisor',
  'mentor',
  'manager',
]);

/**
 * MANDATORY VERIFICATION ENFORCEMENT:
 * Matching is BLOCKED until required documents are VERIFIED for BOTH:
 * - Apprentice: photo_id verified
 * - Host Shop: shop_license AND barber_license verified
 *
 * Registered Barber placements also require a durable supervisor user identity.
 */
async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const {
      studentId,
      shopId,
      shopName,
      shopAddress,
      supervisorName,
      supervisorEmail,
      programSlug,
    } = await req.json();

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }
    if (!programSlug) {
      return NextResponse.json(
        { error: 'programSlug required — placement must be tied to a specific program' },
        { status: 400 },
      );
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
      .maybeSingle();

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
        {
          error: `Student has no active enrollment in program '${programSlug}'. Verify the program slug and enrollment status before assigning a placement.`,
        },
        { status: 422 },
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
      .maybeSingle();

    if (apprentice && shopId) {
      // Full verification check for both apprentice and shop
      const matchGate = await canMatchApprentice(apprentice.id, shopId);

      if (!matchGate.allowed) {
        return NextResponse.json(
          {
            error: 'Document verification required before matching',
            reason: matchGate.reason,
            unverifiedDocuments: matchGate.unverifiedDocs,
            message:
              'Required documents must be verified for both apprentice and host shop before matching.',
          },
          { status: 400 },
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
          { status: 400 },
        );
      }
    }

    let supervisorUserId: string | null = null;
    let resolvedSupervisorName = typeof supervisorName === 'string' ? supervisorName.trim() : '';
    let resolvedSupervisorEmail = typeof supervisorEmail === 'string' ? supervisorEmail.trim().toLowerCase() : '';

    if (shopId) {
      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .select('id, partner_id, active')
        .eq('id', shopId)
        .maybeSingle();
      if (shopError || !shop || shop.active === false || !shop.partner_id) {
        return NextResponse.json({ error: 'Active Host Shop not found' }, { status: 422 });
      }

      if (resolvedSupervisorEmail) {
        const { data: supervisorProfile } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .ilike('email', resolvedSupervisorEmail)
          .maybeSingle();

        if (supervisorProfile?.id) {
          const { data: supervisorMemberships } = await supabase
            .from('partner_users')
            .select('partner_id, role, status')
            .eq('user_id', supervisorProfile.id)
            .eq('partner_id', shop.partner_id)
            .eq('status', 'active');

          const validMembership = (supervisorMemberships || []).find((row: any) =>
            SUPERVISOR_MEMBERSHIP_ROLES.has(String(row.role || '').trim().toLowerCase()),
          );

          if (validMembership) {
            supervisorUserId = supervisorProfile.id;
            resolvedSupervisorName = supervisorProfile.full_name || resolvedSupervisorName;
            resolvedSupervisorEmail = supervisorProfile.email || resolvedSupervisorEmail;
          }
        }
      }

      if (programSlug === 'barber-apprenticeship' && !supervisorUserId) {
        return NextResponse.json(
          {
            error: 'Registered Barber placement requires an assigned Host Shop supervisor',
            message: 'Provide the email of an active owner, partner admin, supervisor, mentor, or manager attached to this Host Shop before activating the placement.',
          },
          { status: 422 },
        );
      }
    }

    // Write canonical placement to apprentice_placements (FK-based).
    // This is the table the OJT enforcement and supervisor verification routes read from.
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
        .neq('shop_id', shopId);

      const { error: canonicalErr } = await supabase.from('apprentice_placements').upsert(
        {
          student_id: studentId,
          shop_id: shopId,
          program_slug: programSlug,
          supervisor_user_id: supervisorUserId,
          start_date: new Date().toISOString().split('T')[0],
          status: 'active',
        },
        { onConflict: 'student_id,shop_id,program_slug' },
      );

      if (canonicalErr) {
        return NextResponse.json({ error: 'Placement failed' }, { status: 500 });
      }

      if (supervisorUserId) {
        await supabase.from('shop_supervisors').upsert(
          {
            shop_id: shopId,
            user_id: supervisorUserId,
            name: resolvedSupervisorName || null,
            email: resolvedSupervisorEmail || null,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'shop_id,user_id' },
        );
      }
    }

    // Also write to shop_placements (text-based legacy record) so existing
    // admin UI reads continue to work until fully migrated.
    const { error: placementError } = await supabase.from('shop_placements').upsert(
      {
        student_id: studentId,
        shop_name: shopName,
        shop_address: shopAddress,
        supervisor_name: resolvedSupervisorName || supervisorName,
        supervisor_email: resolvedSupervisorEmail || supervisorEmail,
        status: 'active',
        assigned_at: new Date().toISOString(),
      },
      { onConflict: 'student_id' },
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
      // Continue - placement was successful
    }

    await logAdminAudit({
      action: AdminAction.SHOP_PLACEMENT_ASSIGNED,
      actorId: user.id,
      entityType: 'apprentice_placements',
      entityId: studentId,
      metadata: {
        shop_id: shopId,
        shop_name: shopName,
        program_slug: programSlug,
        supervisor_user_id: supervisorUserId,
        supervisor_email: resolvedSupervisorEmail || null,
      },
      req,
    });

    return NextResponse.json({ success: true, supervisorUserId });
  } catch (err: any) {
    return NextResponse.json(
      { error: toErrorMessage(err) || 'Failed to assign shop placement' },
      { status: 500 },
    );
  }
}
export const POST = withApiAudit('/api/admin/assign-shop-placement', _POST);
