import { practicalServiceProgress } from '@/lib/apprenticeship/practical-service-progress.mjs';

export type PracticalServiceEntrySummary = {
  id: string;
  enrollment_id?: string | null;
  student_id?: string | null;
  service_name: string;
  performed_on: string;
  subject_type: string;
};

export type PracticalDashboardSummary = {
  /** True when a backing query failed; the card should say so instead of showing zeros. */
  unavailable: boolean;
  /** False when the program has no hands-on service targets configured. */
  hasTargets: boolean;
  recordedCount: number;
  requiredCount: number;
  /** 0-100. Only meaningful when hasTargets is true. */
  percent: number;
  /** Verified, non-voided services across the given enrollments. */
  totalVerified: number;
  recentEntries: PracticalServiceEntrySummary[];
  verifiedByStudent: Record<string, number>;
};

const EMPTY: PracticalDashboardSummary = {
  unavailable: false,
  hasTargets: false,
  recordedCount: 0,
  requiredCount: 0,
  percent: 0,
  totalVerified: 0,
  recentEntries: [],
  verifiedByStudent: {},
};

/**
 * Load the practical-services summary shown on the apprentice and Host Shop
 * dashboards. Reuses the mentor-verified entries in
 * host_shop_practical_service_entries and the program targets in
 * apprenticeship_practical_service_requirements — it does not create a
 * second logging store. Students are read-only here by design: only the
 * Host Shop owner or assigned supervisor records a service (see
 * /api/host-shop/practical-services). Filtering, sorting, and limiting
 * happen in code so the loader works against the chainable query builders
 * used in tests.
 */
export async function loadPracticalServiceSummary(
  db: any,
  options: { enrollmentIds: string[]; programSlug?: string | null },
): Promise<PracticalDashboardSummary> {
  const enrollmentIds = (options.enrollmentIds || []).filter(Boolean);
  if (!enrollmentIds.length) return { ...EMPTY };
  try {
    const [requirementsRes, progressRes, entriesRes] = await Promise.all([
      options.programSlug
        ? db
            .from('apprenticeship_practical_service_requirements')
            .select(
              'id,service_name,exercise_title,instructions,required_count,counts_for_completion,authority',
            )
            .eq('program_slug', options.programSlug)
        : Promise.resolve({ data: [], error: null }),
      db
        .from('host_shop_practical_service_progress')
        .select('enrollment_id,student_id,service_name,recorded_count,last_verified_at')
        .in('enrollment_id', enrollmentIds),
      db
        .from('host_shop_practical_service_entries')
        .select('id,enrollment_id,student_id,service_name,performed_on,subject_type,verified_at,voided_at')
        .in('enrollment_id', enrollmentIds),
    ]);
    if (requirementsRes.error || progressRes.error || entriesRes.error) {
      return { ...EMPTY, unavailable: true };
    }
    const requirements = (requirementsRes.data || []).slice().sort((a: any, b: any) =>
      String(a.exercise_title || '').localeCompare(String(b.exercise_title || '')),
    );
    const practice = practicalServiceProgress(requirements, progressRes.data || []);
    const verifiedByStudent: Record<string, number> = {};
    let totalVerified = 0;
    for (const row of progressRes.data || []) {
      const count = Math.max(0, Number(row.recorded_count ?? 0));
      totalVerified += count;
      if (row.student_id) {
        verifiedByStudent[row.student_id] = (verifiedByStudent[row.student_id] || 0) + count;
      }
    }
    const recentEntries = ((entriesRes.data || []) as any[])
      .filter((entry) => !entry.voided_at && entry.verified_at)
      .sort((a, b) => String(b.performed_on || '').localeCompare(String(a.performed_on || '')))
      .slice(0, 10)
      .map((entry) => ({
        id: String(entry.id),
        enrollment_id: entry.enrollment_id ?? null,
        student_id: entry.student_id ?? null,
        service_name: String(entry.service_name || ''),
        performed_on: String(entry.performed_on || ''),
        subject_type: String(entry.subject_type || ''),
      }));
    return {
      unavailable: false,
      hasTargets: requirements.length > 0,
      recordedCount: practice.recordedCount,
      requiredCount: practice.requiredCount,
      percent: practice.percent,
      totalVerified,
      recentEntries,
      verifiedByStudent,
    };
  } catch {
    return { ...EMPTY, unavailable: true };
  }
}
