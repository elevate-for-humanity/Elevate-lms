export const APPLICATION_REVIEW_STATUSES = [
  'pending',
  'submitted',
  'in_review',
  'under_review',
  'pending_admin_review',
] as const;

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
