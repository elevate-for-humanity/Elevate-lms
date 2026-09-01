import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ApprenticeshipRuntimeContext } from '@/lib/apprenticeship/runtime-context';

export type RegisteredApprenticeshipProgress = {
  competencies: {
    completed: number;
    required: number;
    percent: number;
    records: Array<Record<string, any>>;
  };
  rti: {
    verifiedMinutes: number;
    verifiedHours: number;
    requiredHours: number;
    percent: number;
    pendingEntries: number;
    rejectedEntries: number;
  };
  ojl: {
    approvedHours: number;
    pendingEntries: number;
    transferHours: number;
    transferHoursVerified: boolean;
    totalCreditedHours: number;
  };
  completionReady: boolean;
};

function positiveNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export async function loadRegisteredApprenticeshipProgress(
  db: SupabaseClient,
  context: ApprenticeshipRuntimeContext,
): Promise<RegisteredApprenticeshipProgress> {
  if (!context.contract) throw new Error(`REGISTERED_PROGRAM_CONTRACT_MISSING:${context.programSlug}`);

  const [competencyResult, rtiResult, hourResult] = await Promise.all([
    db
      .from('apprentice_competency_records')
      .select('id,enrollment_id,competency_id,completed,date_completed,verified_by,verified_by_name,notes,requires_practical_evidence,performance_subject,evidence_type,evidence_url,practical_performed_at,evidence_review_status,verified_by_license_number,state_standard_version,updated_at')
      .eq('enrollment_id', context.enrollment.id),
    db
      .from('apprenticeship_rti_entries')
      .select('id,status,minutes_claimed,minutes_verified,requirement_id,instruction_date,verified_by,verified_at')
      .eq('enrollment_id', context.enrollment.id)
      .eq('standard_key', context.contract.standardVersionKey),
    db
      .from('hour_entries')
      .select('id,status,approval_status,accepted_hours,hours,hours_claimed,source_type,host_shop_id,program_slug')
      .eq('user_id', context.studentId)
      .eq('program_slug', context.programSlug),
  ]);

  if (competencyResult.error) throw competencyResult.error;
  if (rtiResult.error) throw rtiResult.error;
  if (hourResult.error) throw hourResult.error;

  const allowedCompetencyIds = new Set(context.contract.standard.competencies.map((item) => item.id));
  const completedCompetencyIds = new Set(
    (competencyResult.data || [])
      .filter((row) => row.completed && allowedCompetencyIds.has(row.competency_id))
      .map((row) => row.competency_id),
  );
  const completedCompetencies = completedCompetencyIds.size;
  const requiredCompetencies = context.contract.completion.competencyCount;

  let verifiedMinutes = 0;
  let pendingRti = 0;
  let rejectedRti = 0;
  for (const row of rtiResult.data || []) {
    if (row.status === 'verified' || row.status === 'approved') {
      verifiedMinutes += positiveNumber(row.minutes_verified);
    } else if (row.status === 'rejected') {
      rejectedRti += 1;
    } else {
      pendingRti += 1;
    }
  }
  const verifiedRtiHours = Math.round((verifiedMinutes / 60) * 100) / 100;
  const requiredRtiHours = context.contract.completion.requiredRtiHours;

  let approvedOjlHours = 0;
  let pendingOjl = 0;
  for (const row of hourResult.data || []) {
    if (context.placement?.shop_id && row.host_shop_id && row.host_shop_id !== context.placement.shop_id) continue;
    const isApproved = row.approval_status === 'approved' || row.status === 'approved';
    const isPending = row.approval_status === 'pending' || row.status === 'pending';
    if (isPending && !isApproved) pendingOjl += 1;
    if (!isApproved) continue;
    approvedOjlHours +=
      positiveNumber(row.accepted_hours) || positiveNumber(row.hours) || positiveNumber(row.hours_claimed);
  }

  const transferHoursVerified = context.enrollment.transfer_hours_verified === true;
  const transferHours = transferHoursVerified
    ? positiveNumber(context.enrollment.transfer_hours)
    : 0;
  const totalCreditedHours = approvedOjlHours + transferHours;

  const competencyPercent = requiredCompetencies
    ? Math.min(100, Math.round((completedCompetencies / requiredCompetencies) * 100))
    : 0;
  const rtiPercent = requiredRtiHours
    ? Math.min(100, Math.round((verifiedRtiHours / requiredRtiHours) * 100))
    : 0;

  const completionReady =
    completedCompetencies >= requiredCompetencies &&
    verifiedRtiHours >= requiredRtiHours &&
    Boolean(context.placement?.id && context.placement.supervisor_user_id);

  return {
    competencies: {
      completed: completedCompetencies,
      required: requiredCompetencies,
      percent: competencyPercent,
      records: competencyResult.data || [],
    },
    rti: {
      verifiedMinutes,
      verifiedHours: verifiedRtiHours,
      requiredHours: requiredRtiHours,
      percent: rtiPercent,
      pendingEntries: pendingRti,
      rejectedEntries: rejectedRti,
    },
    ojl: {
      approvedHours: Math.round(approvedOjlHours * 100) / 100,
      pendingEntries: pendingOjl,
      transferHours: Math.round(transferHours * 100) / 100,
      transferHoursVerified,
      totalCreditedHours: Math.round(totalCreditedHours * 100) / 100,
    },
    completionReady,
  };
}
