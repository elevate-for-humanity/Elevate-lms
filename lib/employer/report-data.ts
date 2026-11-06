import type { SupabaseClient } from '@supabase/supabase-js';

/** Read the canonical hiring tables through the signed-in client's RLS. */
export async function loadEmployerHiringReport(db: SupabaseClient, employerId: string) {
  if (!employerId) throw new Error('An employer record is required to load hiring reports.');
  const applications = () =>
    db
      .from('job_applications')
      .select('id,posting:job_postings!inner(employer_id)', { count: 'exact', head: true })
      .eq('posting.employer_id', employerId);
  const results = await Promise.all([
    db
      .from('job_postings')
      .select('id', { count: 'exact', head: true })
      .eq('employer_id', employerId)
      .eq('status', 'active'),
    applications(),
    applications().eq('status', 'pending'),
    applications().eq('status', 'reviewed'),
    applications().eq('status', 'hired'),
    applications().eq('status', 'rejected'),
    db
      .from('job_placements')
      .select('start_date,created_at', { count: 'exact' })
      .eq('employer_id', employerId)
      .eq('status', 'placed')
      .order('start_date', { ascending: false })
      .limit(100),
    db
      .from('candidate_employer_referrals')
      .select('id', { count: 'exact', head: true })
      .eq('employer_id', employerId)
      .neq('status', 'revoked'),
  ]);
  // A failed query or absent count must not look like a successful empty report.
  if (results.some((result) => result.error || typeof result.count !== 'number'))
    throw new Error('Hiring reports could not be loaded. Please try again.');
  const [postings, all, pending, reviewed, hired, rejected, placementResult, referrals] = results;
  const placements = placementResult.data ?? [];
  const intervals = placements.flatMap((placement) => {
    const start = Date.parse(placement.start_date ?? '');
    const created = Date.parse(placement.created_at ?? '');
    return Number.isFinite(start) && Number.isFinite(created) && start >= created
      ? [(start - created) / 86_400_000]
      : [];
  });
  return {
    activePostings: postings.count!,
    totalApplications: all.count!,
    newApps: pending.count!,
    underReview: reviewed.count!,
    hires: hired.count!,
    rejected: rejected.count!,
    placements,
    placementCount: placementResult.count!,
    referrals: referrals.count!,
    avgDaysToHire: intervals.length
      ? Math.round(intervals.reduce((sum, days) => sum + days, 0) / intervals.length)
      : null,
  };
}
