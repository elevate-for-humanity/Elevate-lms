import type { SupabaseClient } from '@/lib/supabase';

/**
 * OJL and RTI are separate compliance buckets for Registered Apprenticeship.
 * They must NEVER be summed into a single "total" for apprenticeship completion.
 *
 * OJL bucket: ojl, host_shop, timeclock, manual (all on-the-job work)
 * RTI bucket: rti, in_state_barber_school, continuing_education (classroom/theory)
 * Transfer:   out_of_state_school, out_of_state_license (categorized per entry)
 * Also includes approved hour_transfer_requests
 */

// Which source_types count as OJL (On-the-Job Learning)
const OJL_SOURCE_TYPES = new Set(['ojl', 'host_shop', 'timeclock', 'manual']);

// Which source_types count as RTI (Related Technical Instruction)
const RTI_SOURCE_TYPES = new Set(['rti', 'in_state_barber_school', 'continuing_education']);

export interface ApprovedHours {
  ojl: number;
  rti: number;
  transferredOjl: number;
  transferredRti: number;
}

/**
 * Returns approved hours for a user, split into OJL and RTI buckets.
 * Uses accepted_hours when available (employer may adjust), falls back to hours_claimed.
 * Only counts status = 'approved' or 'locked'.
 *
 * Also includes approved transfer requests from hour_transfer_requests table.
 * Transfer hours are classified by source_type:
 * - in_state_barber_school -> RTI
 * - out_of_state_school, out_of_state_license -> defaults to OJL unless specified
 */
export async function getApprovedHoursByType(
  db: SupabaseClient,
  userId: string,
  programSlug?: string,
): Promise<ApprovedHours> {
  // hour_entries is the canonical source — includes both student-logged
  // and admin-entered hours. apprenticeship_hours is a legacy/parallel
  // table that may contain duplicates; do NOT sum both.
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
    return { ojl: 0, rti: 0, transferredOjl: 0, transferredRti: 0 };
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
      if (row.category === 'rti') {
        rti += hrs;
      } else {
        ojl += hrs;
      }
    }
  }

  // Query approved transfer requests
  // First get the apprentice_id for this user
  const { data: apprenticeData } = await db
    .from('apprentices')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  let transferredOjl = 0;
  let transferredRti = 0;

  if (apprenticeData?.id) {
    // Get approved/evaluated transfer requests
    const { data: transferData } = await db
      .from('hour_transfer_requests')
      .select('hours_accepted, source_type, status')
      .eq('apprentice_id', apprenticeData.id)
      .in('status', ['approved', 'partial', 'evaluated']);

    if (transferData) {
      for (const transfer of transferData) {
        // Use hours_accepted if available, otherwise skip
        const hrs = Number(transfer.hours_accepted) || 0;
        if (hrs <= 0) continue;

        // Classify based on source_type
        if (transfer.source_type === 'in_state_barber_school') {
          transferredRti += hrs;
        } else {
          // out_of_state_school, out_of_state_license, etc. -> OJL by default
          transferredOjl += hrs;
        }
      }
    }
  }

  return { ojl, rti, transferredOjl, transferredRti };
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
  },
): Promise<EligibilityResult> {
  const hours = await getApprovedHoursByType(db, userId, program.slug);

  const minOjl = program.min_ojl_hours || 0;
  const minRti = program.min_rti_hours || 0;

  const reasons: string[] = [];

  if (minOjl > 0 && hours.ojl < minOjl) {
    reasons.push(`OJL hours: ${hours.ojl} of ${minOjl} required (${minOjl - hours.ojl} remaining)`);
  }

  if (minRti > 0 && hours.rti < minRti) {
    reasons.push(`RTI hours: ${hours.rti} of ${minRti} required (${minRti - hours.rti} remaining)`);
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
