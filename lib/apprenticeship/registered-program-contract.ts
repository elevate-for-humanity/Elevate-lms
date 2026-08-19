import type { SupabaseClient } from '@supabase/supabase-js';
import {
  APPENDIX_A_REGISTRATION,
  APPENDIX_A_STANDARDS,
  type AppendixAStandard,
} from '@/lib/compliance/appendix-a-standards';

/**
 * Canonical registered-apprenticeship boundary.
 *
 * Source ownership:
 * - Appendix A: immutable occupation standard (competencies, RTI outline,
 *   ratio, probation and baseline wage progression).
 * - Supabase: operational RAPIDS state (employer registration, employer wage
 *   schedule, active RTI providers, enrollment/placement state).
 *
 * No page, route, course or report should recreate this merge itself.
 */

export type RegisteredProgramKey = keyof typeof APPENDIX_A_STANDARDS;

export type EmployerWageSchedule = {
  partnerId: string;
  scheduleName: string | null;
  scheduleVersion: string | null;
  journeyworkerHourlyRate: number | null;
  startingHourlyRate: number | null;
  endingHourlyRate: number | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  sourceSystem: string | null;
};

export type RegisteredRtiProvider = {
  id: string;
  providerName: string;
  partnerId: string | null;
  providerUserId: string | null;
  status: string;
  addedAt: string | null;
  sourceSystem: string | null;
};

export type RegisteredProgramContract = {
  sponsor: {
    legalName: string;
    registrationNumber: string;
    registrationDate: string;
    revisionDate: string;
  };
  standardKey: string;
  programSlug: string;
  standard: AppendixAStandard;
  completion: {
    basis: 'competency';
    competencyCount: number;
    requiredRtiHours: number;
    fixedOjlCompletionHours: null;
  };
  employer: null | {
    partnerId: string;
    name: string;
    rapidsEmployerNumber: string | null;
    rapidsRegistrationStatus: string | null;
    wageSchedule: EmployerWageSchedule | null;
  };
  rtiProviders: RegisteredRtiProvider[];
};

function findStandard(programSlug: string) {
  const entry = Object.entries(APPENDIX_A_STANDARDS).find(([, standard]) =>
    standard.programSlugs.includes(programSlug),
  );

  if (!entry) return null;
  return { standardKey: entry[0], standard: entry[1] };
}

export function getRegisteredProgramStandard(programSlug: string) {
  const found = findStandard(programSlug);
  if (!found) return null;

  return {
    sponsor: APPENDIX_A_REGISTRATION,
    standardKey: found.standardKey,
    programSlug,
    standard: found.standard,
    completion: {
      basis: 'competency' as const,
      competencyCount: found.standard.competencyCount,
      requiredRtiHours: found.standard.relatedInstructionHours,
      fixedOjlCompletionHours: null,
    },
  };
}

export async function resolveRegisteredProgramContract(
  supabase: SupabaseClient,
  input: {
    programSlug: string;
    partnerId?: string | null;
    enrollmentId?: string | null;
  },
): Promise<RegisteredProgramContract | null> {
  const base = getRegisteredProgramStandard(input.programSlug);
  if (!base) return null;

  let partnerId = input.partnerId || null;

  if (!partnerId && input.enrollmentId) {
    const { data: enrollment, error } = await supabase
      .from('program_enrollments')
      .select('host_shop_id')
      .eq('id', input.enrollmentId)
      .maybeSingle();
    if (error) throw error;
    partnerId = enrollment?.host_shop_id || null;
  }

  const [providersResult, employerResult, wageResult] = await Promise.all([
    supabase
      .from('rapids_rti_providers')
      .select('id, provider_name, partner_id, provider_user_id, status, added_at, source_system')
      .eq('sponsor_registration_number', APPENDIX_A_REGISTRATION.registrationNumber)
      .eq('standard_key', base.standardKey)
      .eq('occupation_code', base.standard.rapidsCode)
      .eq('status', 'active')
      .order('provider_name'),
    partnerId
      ? supabase
          .from('partners')
          .select('id, name, dba, shop_name, legal_name, rapids_employer_number, rapids_registration_status')
          .eq('id', partnerId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    partnerId
      ? supabase
          .from('rapids_employer_wage_schedules')
          .select('partner_id, schedule_name, schedule_version, journeyworker_hourly_rate, starting_hourly_rate, ending_hourly_rate, effective_from, effective_to, source_system')
          .eq('partner_id', partnerId)
          .eq('sponsor_registration_number', APPENDIX_A_REGISTRATION.registrationNumber)
          .eq('standard_key', base.standardKey)
          .eq('occupation_code', base.standard.rapidsCode)
          .eq('is_active', true)
          .order('effective_from', { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (providersResult.error) throw providersResult.error;
  if (employerResult.error) throw employerResult.error;
  if (wageResult.error) throw wageResult.error;

  const employerRow = employerResult.data as Record<string, unknown> | null;
  const wageRow = wageResult.data as Record<string, unknown> | null;

  return {
    sponsor: {
      legalName: APPENDIX_A_REGISTRATION.sponsor,
      registrationNumber: APPENDIX_A_REGISTRATION.registrationNumber,
      registrationDate: APPENDIX_A_REGISTRATION.registrationDate,
      revisionDate: APPENDIX_A_REGISTRATION.revisionDate,
    },
    standardKey: base.standardKey,
    programSlug: input.programSlug,
    standard: base.standard,
    completion: base.completion,
    employer: employerRow
      ? {
          partnerId: String(employerRow.id),
          name: String(
            employerRow.dba ||
              employerRow.shop_name ||
              employerRow.legal_name ||
              employerRow.name ||
              'Host Shop',
          ),
          rapidsEmployerNumber: employerRow.rapids_employer_number
            ? String(employerRow.rapids_employer_number)
            : null,
          rapidsRegistrationStatus: employerRow.rapids_registration_status
            ? String(employerRow.rapids_registration_status)
            : null,
          wageSchedule: wageRow
            ? {
                partnerId: String(wageRow.partner_id),
                scheduleName: wageRow.schedule_name ? String(wageRow.schedule_name) : null,
                scheduleVersion: wageRow.schedule_version ? String(wageRow.schedule_version) : null,
                journeyworkerHourlyRate:
                  wageRow.journeyworker_hourly_rate == null
                    ? null
                    : Number(wageRow.journeyworker_hourly_rate),
                startingHourlyRate:
                  wageRow.starting_hourly_rate == null
                    ? null
                    : Number(wageRow.starting_hourly_rate),
                endingHourlyRate:
                  wageRow.ending_hourly_rate == null
                    ? null
                    : Number(wageRow.ending_hourly_rate),
                effectiveFrom: wageRow.effective_from ? String(wageRow.effective_from) : null,
                effectiveTo: wageRow.effective_to ? String(wageRow.effective_to) : null,
                sourceSystem: wageRow.source_system ? String(wageRow.source_system) : null,
              }
            : null,
        }
      : null,
    rtiProviders: (providersResult.data || []).map((row) => ({
      id: row.id,
      providerName: row.provider_name,
      partnerId: row.partner_id,
      providerUserId: row.provider_user_id,
      status: row.status,
      addedAt: row.added_at,
      sourceSystem: row.source_system,
    })),
  };
}

/** Resolve the wage floor for a specific employer without flattening an
 * employer-specific RAPIDS wage schedule into the occupation standard. */
export function resolveApplicableWage(
  contract: RegisteredProgramContract,
  completedCompetencies: number,
) {
  const baselineMilestones = contract.standard.wageMilestones;
  let appendixRate = contract.standard.startingHourlyRate;

  for (const milestone of baselineMilestones) {
    if (completedCompetencies >= milestone.completedCompetencies) {
      appendixRate = Math.max(appendixRate, milestone.hourlyRate);
    }
  }

  const employerSchedule = contract.employer?.wageSchedule || null;
  const employerStart = employerSchedule?.startingHourlyRate ?? null;
  const employerEnd = employerSchedule?.endingHourlyRate ?? null;

  return {
    appendixRate,
    employerStartingRate: employerStart,
    employerEndingRate: employerEnd,
    requiredRegisteredRate:
      employerStart == null ? appendixRate : Math.max(appendixRate, employerStart),
    scheduleSource: employerSchedule ? 'employer_rapids_schedule' : 'appendix_a_baseline',
  };
}
