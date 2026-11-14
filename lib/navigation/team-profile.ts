/** Keep honorifics and middle initials from creating duplicate profile URLs. */
export function teamProfileHref(member: { name: string }): string {
  const slug = member.name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/^Dr\.?\s+/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (slug === 'elizabeth-greene') return '/about/elizabeth-greene';
  return `/about/team/${slug}`;
}

/** Legacy group artwork was removed; never substitute a generated person for a staff member. */
export function teamPortrait(member: { name: string; image_url?: string | null; headshotSrc?: string | null }): string | undefined {
  const source = member.image_url || member.headshotSrc;
  if (!source || !/\/images\/team-new\/team-[1-4]\.jpg(?:[?#]|$)/.test(source)) return source || undefined;
  const groups: Record<string, string> = {
    'Training Team': '/images/about-training-20261102.webp',
    'Career Services': '/images/career-advising-20261102.webp',
    'Student Support': '/images/career-advising-20261102.webp',
    'Operations Team': '/images/programs/refresh-20261101/employers.webp',
  };
  return groups[member.name];
}
export function teamPortraitAlt(name: string, source: string): string {
  return /about-training-20261102|career-advising-20261102|refresh-20261101\/employers/.test(source) ? `Illustrative ${name.toLowerCase()} scene` : name;
}
