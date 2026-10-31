export const LEARNER_ROSTER_ROLES = [
  'student',
  'learner',
  'apprentice',
  'barber_apprentice',
  'cosmetology_apprentice',
] as const;

const TEST_EMAIL_DOMAINS = new Set([
  'qa.invalid',
  'elevatetest.com',
  'elevate-test.dev',
  'test.elevateforhumanity.org',
  'example.com',
]);

export function isProductionRosterProfile(profile: {
  id?: unknown;
  role?: unknown;
  full_name?: unknown;
  email?: unknown;
}): boolean {
  const domain =
    String(profile.email || '')
      .trim()
      .toLowerCase()
      .split('@')
      .pop() || '';
  return (
    typeof profile.id === 'string' &&
    profile.id.length > 0 &&
    !/^\[QA E2E\]/i.test(String(profile.full_name || '').trim()) &&
    !TEST_EMAIL_DOMAINS.has(domain) &&
    !domain.endsWith('.test')
  );
}

export function isLearnerRosterProfile(
  profile: Parameters<typeof isProductionRosterProfile>[0],
): boolean {
  return (
    isProductionRosterProfile(profile) &&
    (LEARNER_ROSTER_ROLES as readonly string[]).includes(String(profile.role || '').toLowerCase())
  );
}
