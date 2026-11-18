export const APPLICATION_REVIEW_STATUSES = [
  'pending',
  'submitted',
  'in_review',
  'under_review',
  'pending_admin_review',
] as const;

export const APPLICATION_REVIEW_URL = `/applications?status=${APPLICATION_REVIEW_STATUSES.join(',')}`;

export function applicationSearchFilter(search: string) {
  const value = JSON.stringify(`%${search.trim()}%`);
  return ['first_name', 'last_name', 'email', 'full_name']
    .map((field) => `${field}.ilike.${value}`)
    .join(',');
}

export function applicationProgramFilter(program: { slug: string; title: string }) {
  const filters = [
    `program_slug.eq.${JSON.stringify(program.slug)}`,
    `program_interest.eq.${JSON.stringify(program.slug)}`,
    `program_interest.eq.${JSON.stringify(program.title)}`,
  ];
  // Preserve the existing legacy CDL intake alias while other options come
  // from the actual program catalog instead of a single hard-coded option.
  if (program.slug === 'cdl-training') filters.push('program_interest.ilike.%cdl%');
  return filters.join(',');
}

/** Waiting for initial review; separate from applications already in review. */
export const APPLICATION_AWAITING_REVIEW_STATUSES = [
  'pending',
  'submitted',
  'pending_admin_review',
] as const;

/** Exact database counts avoid the API row limit on unpaginated status reads. */
export async function loadApplicationStatusCounts(
  db: import('@supabase/supabase-js').SupabaseClient,
  includeTest = false,
) {
  const { excludeQaProfiles } = await import('./operational-profile-query');
  const statuses = [
    'pending',
    'submitted',
    'pending_admin_review',
    'in_review',
    'under_review',
    'approved',
    'ready_to_enroll',
    'enrolled',
    'rejected',
    'pending_workone',
    'pending_funding',
    'funding_review',
    'waitlisted',
    'withdrawn',
  ];
  const results = await Promise.all(
    [null, ...statuses].map(async (status) => {
      let query = db.from('applications').select('id', { count: 'exact', head: true });
      if (!includeTest) query = excludeQaProfiles(query);
      if (status !== null) query = query.eq('status', status);
      const { count, error } = await query;
      if (error || count === null) throw new Error('APPLICATION_COUNTS_UNAVAILABLE');
      return { status, count };
    }),
  );
  return {
    total: results[0].count,
    statuses: Object.fromEntries(results.slice(1).map(({ status, count }) => [status!, count])),
  };
}
