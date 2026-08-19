/**
 * GET /api/learner/apprenticeship
 * Canonical registered-apprenticeship progress endpoint.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/requireAuth';
import { createClient } from '@/lib/supabase/server';
import {
  getRegisteredProgramStandard,
  resolveRegisteredProgramContract,
} from '@/lib/apprenticeship/registered-program-contract';

export const dynamic = 'force-dynamic';

const BARBER_SLUG = 'barber-apprenticeship';
const OJL_SOURCE_TYPES = ['ojl', 'host_shop', 'timeclock', 'manual'];

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const base = getRegisteredProgramStandard(BARBER_SLUG);
    if (!base) {
      return NextResponse.json({ error: 'Registered program configuration unavailable' }, { status: 500 });
    }

    const { data: enrollment, error: enrollmentError } = await supabase
      .from('program_enrollments')
      .select('id, program_slug, status, rapids_status, rapids_id, host_shop_id, supervisor_id, transfer_hours, transfer_hours_verified')
      .or(`user_id.eq.${user.id},student_id.eq.${user.id}`)
      .eq('program_slug', base.programSlug)
      .in('status', ['active', 'enrolled', 'in_progress', 'confirmed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (enrollmentError) throw enrollmentError;
    if (!enrollment) {
      return NextResponse.json({ error: 'Not an active Barber apprenticeship enrollment' }, { status: 404 });
    }

    const contract = await resolveRegisteredProgramContract(supabase, {
      programSlug: enrollment.program_slug,
      partnerId: enrollment.host_shop_id,
      enrollmentId: enrollment.id,
    });
    if (!contract) {
      return NextResponse.json({ error: 'Registered program contract unavailable' }, { status: 500 });
    }

    const [competencyResult, rtiResult, hoursResult, rapidsResult] = await Promise.all([
      supabase
        .from('apprentice_competency_records')
        .select('competency_id, completed, date_completed, verified_by, verified_by_name, notes')
        .eq('enrollment_id', enrollment.id),
      supabase
        .from('barber_appendix_a_rti_progress')
        .select('requirement_title, required_hours, verified_hours, remaining_hours, pending_entries, requirement_met')
        .eq('enrollment_id', enrollment.id),
      supabase
        .from('hour_entries')
        .select('hours_claimed, accepted_hours, source_type, status, work_date, approved_by_user_id, host_shop_id')
        .eq('user_id', user.id)
        .eq('program_slug', enrollment.program_slug),
      supabase
        .from('rapids_registrations')
        .select('rapids_id, occupation_code, sponsor_id, registration_date, status')
        .eq('enrollment_id', enrollment.id)
        .maybeSingle(),
    ]);

    if (competencyResult.error) throw competencyResult.error;
    if (rtiResult.error) throw rtiResult.error;
    if (hoursResult.error) throw hoursResult.error;

    const standard = contract.standard;
    const competencyRows = competencyResult.data || [];
    const completedCompetencies = competencyRows.filter((row) => row.completed).length;
    const competencyPercent = Math.min(
      100,
      Math.round((completedCompetencies / contract.completion.competencyCount) * 100),
    );

    const rtiRows = rtiResult.data || [];
    const verifiedRtiHours = rtiRows.reduce((sum, row) => sum + Number(row.verified_hours || 0), 0);
    const remainingRtiHours = Math.max(0, contract.completion.requiredRtiHours - verifiedRtiHours);
    const rtiComplete =
      rtiRows.length > 0 &&
      rtiRows.every((row) => row.requirement_met) &&
      verifiedRtiHours >= contract.completion.requiredRtiHours;

    const hourRows = hoursResult.data || [];
    const approvedOjlHours = hourRows
      .filter((row) => row.status === 'approved' && OJL_SOURCE_TYPES.includes(row.source_type))
      .reduce((sum, row) => sum + Number(row.accepted_hours ?? row.hours_claimed ?? 0), 0);

    const rapids = rapidsResult.data || null;
    const competenciesComplete = completedCompetencies >= contract.completion.competencyCount;
    const placementReady = Boolean(enrollment.host_shop_id && enrollment.supervisor_id);

    return NextResponse.json({
      success: true,
      enrollmentId: enrollment.id,
      learnerId: user.id,
      programSlug: enrollment.program_slug,
      status: enrollment.status,
      completionBasis: contract.completion.basis,
      sponsor: contract.sponsor,
      occupation: {
        title: standard.occupationTitle,
        rapidsCode: standard.rapidsCode,
        onetSocCode: standard.onetSocCode,
        revisionDate: contract.sponsor.revisionDate,
      },
      config: {
        totalHoursRequired: contract.completion.fixedOjlCompletionHours,
        ojlHoursRequired: contract.completion.fixedOjlCompletionHours,
        rtiHoursRequired: contract.completion.requiredRtiHours,
        competencyCount: contract.completion.competencyCount,
        apprenticeToMentorRatio: standard.apprenticeToMentorRatio,
        probationaryHours: standard.probationaryHours,
      },
      progress: {
        percentComplete: competencyPercent,
        competenciesComplete,
        rtiComplete,
        placementReady,
        programComplete: competenciesComplete && rtiComplete && placementReady,
      },
      hours: {
        ojl: {
          required: contract.completion.fixedOjlCompletionHours,
          approved: approvedOjlHours,
          purpose: 'auditable supervised work record; not the completion denominator for this competency-based occupation',
        },
        rti: {
          required: contract.completion.requiredRtiHours,
          verified: verifiedRtiHours,
          remaining: remainingRtiHours,
          requirements: rtiRows,
        },
      },
      competencyTracking: {
        totalRequired: contract.completion.competencyCount,
        verified: completedCompetencies,
        remaining: Math.max(0, contract.completion.competencyCount - completedCompetencies),
        percentComplete: competencyPercent,
        signoffs: competencyRows,
      },
      employer: contract.employer,
      rtiProviders: contract.rtiProviders,
      placement: {
        hostShopId: enrollment.host_shop_id,
        supervisorId: enrollment.supervisor_id,
        requiredRatio: standard.apprenticeToMentorRatio,
      },
      transferCredit: {
        hours: Number(enrollment.transfer_hours || 0),
        verified: Boolean(enrollment.transfer_hours_verified),
      },
      rapids: rapids || {
        rapids_id: enrollment.rapids_id,
        status: enrollment.rapids_status || 'pending',
        occupation_code: standard.rapidsCode,
        sponsor_id: contract.sponsor.registrationNumber,
      },
    });
  } catch (error) {
    console.error('[Apprenticeship API] Error:', error);
    return NextResponse.json({ error: 'Failed to load apprenticeship data' }, { status: 500 });
  }
}
