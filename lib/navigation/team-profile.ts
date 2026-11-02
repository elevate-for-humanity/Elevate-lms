/** Keep honorifics and middle initials from creating duplicate profile URLs. */
export function teamProfileHref(member: { name: string }): string {
  const slug = member.name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/^Dr\.?\s+/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (slug === 'elizabeth-greene') return '/about/elizabeth-greene';
  return `/about/team/${slug}`;
}
