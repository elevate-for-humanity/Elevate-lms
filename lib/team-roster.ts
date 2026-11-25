import { teamProfileHref } from '@/lib/navigation/team-profile';

export interface TeamProfileMember {
  id: string;
  name: string;
  title: string;
  bio?: string | null;
  image_url?: string | null;
  headshotSrc?: string | null;
  credentials?: string[] | null;
}

function normalizedNameSlug(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function matchesProfileSlug(member: TeamProfileMember, slug: string): boolean {
  return (
    member.id === slug ||
    normalizedNameSlug(member.name) === slug ||
    teamProfileHref(member).endsWith(`/${slug}`)
  );
}

/**
 * A successful database lookup is authoritative, including an empty result.
 * Static data is only a resilience fallback when the database query failed.
 */
export function resolveTeamProfileMember(
  slug: string,
  databaseMembers: TeamProfileMember[],
  fallbackMembers: TeamProfileMember[],
  databaseQueryFailed: boolean,
): TeamProfileMember | undefined {
  const roster = databaseQueryFailed ? fallbackMembers : databaseMembers;
  return roster.find((member) => matchesProfileSlug(member, slug));
}
