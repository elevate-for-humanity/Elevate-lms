import { SupabaseClient } from '@supabase/supabase-js';

/**
 * OJL and RTI are separate compliance buckets for Registered Apprenticeship.
 * They must NEVER be summed into a single "total" for apprenticeship completion.
 *
 * OJL bucket: ojl, host_shop, timeclock, manual (all on-the-job work)
 * RTI bucket: rti, in_state_barber_school, continuing_education (classroom/theory)
 * Transfer:   out_of_state_school, out_of_state_license (categorized per entry)
 */

// Which source_types count as OJL (On-the-Job Learning)
const OJL_SOURCE_TYPES = new Set([
  'ojl',
  'host_shop',
  'timeclock',
  'manual',
]);

// Which source_types count as RTI (Related Technical Instruction)
const RTI_SOURCE_TYPES = new Set([
  'rti',
  'in_state_barber_school',
  'continuing_education',
]);

export interface ApprovedHours {
  ojl: number;
  rti: number;
}

/**
 * Returns approved hours for a user, split into OJL and RTI buckets.
 * Uses accepted_hours when available (employer may adjust), falls back to hours_claimed.
 * Only counts status = 'approved' or 'locked'.
 *
 * Transfer entries (out_of_state_school, out_of_state_license) are classified
 * by their `category` field if present, otherwise default to OJL.
 */
export async function getApprovedHoursByType(
  db: SupabaseClient,
  userId: string,
  programSlug?: string
): Promise<ApprovedHours> {
  let query = db
    .from('hour_entries')
    .select('hours_claimed, accepted_hours, source_type, category')
    .eq('user_id', userId)
    .in('status', ['approved', 'locked']);

  if (programSlug) {
    query = query.eq('program_slug', programSlug);
  }

  const { data, error } = await query;

  if (error || !data) {
    return { ojl: 0, rti: 0 };
  }

  let ojl = 0;
  let rti = 0;

  for (const row of data) {
    const hrs = Number(row.accepted_hours) || Number(row.hours_claimed) || 0;

    if (OJL_SOURCE_TYPES.has(row.source_type)) {
      ojl += hrs;
    } else if (RTI_SOURCE_TYPES.has(row.source_type)) {
      rti += hrs;
    } else if (
      row.source_type === 'out_of_state_school' ||
      row.source_type === 'out_of_state_license'
    ) {
      // Transfer hours: classify by category if set
      if (row.category === 'rti') {
        rti += hrs;
      } else {
        // Default transfer hours to OJL (practical experience)
        ojl += hrs;
      }
    }
    // Unknown source_types are excluded from both buckets
  }

  return { ojl, rti };
}

export interface EligibilityResult {
  eligible: boolean;
  blockingReasons: string[];
  evidence: {
    approvedHours: ApprovedHours;
    minOjlHours: number;
    minRtiHours: number;
  };
}

/**
 * Checks whether a user meets the separate OJL and RTI hour minimums
 * for an apprenticeship credential. OJL and RTI are independent gates —
 * neither can substitute for the other.
 */
export async function checkApprenticeshipEligibility(
  db: SupabaseClient,
  userId: string,
  program: {
    min_ojl_hours: number | null;
    min_rti_hours: number | null;
    slug?: string;
  }
): Promise<EligibilityResult> {
  const hours = await getApprovedHoursByType(db, userId, program.slug);

  const minOjl = program.min_ojl_hours || 0;
  const minRti = program.min_rti_hours || 0;

  const reasons: string[] = [];

  if (minOjl > 0 && hours.ojl < minOjl) {
    reasons.push(
      `OJL hours: ${hours.ojl} of ${minOjl} required (${minOjl - hours.ojl} remaining)`
    );
  }

  if (minRti > 0 && hours.rti < minRti) {
    reasons.push(
      `RTI hours: ${hours.rti} of ${minRti} required (${minRti - hours.rti} remaining)`
    );
  }

  return {
    eligible: reasons.length === 0,
    blockingReasons: reasons,
    evidence: {
      approvedHours: hours,
      minOjlHours: minOjl,
      minRtiHours: minRti,
    },
  };
}
