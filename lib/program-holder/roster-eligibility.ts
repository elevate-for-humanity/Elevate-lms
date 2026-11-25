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

/**
 * Roster eligibility for a QA fixture holder's OWN roster only.
 *
 * The isolated-QA provisioner creates a disposable holder and its student
 * together (both `[QA E2E]`-marked, `qa.invalid` mail), and the E2E report
 * tests certify that roster. `isLearnerRosterProfile` deliberately excludes
 * exactly those markers so a disposable QA identity can never leak into a
 * live roster — which left every QA holder's roster empty and the report
 * form with no students to select (E2E shard 4/4, every PR).
 *
 * This variant keeps the learner-role check but drops the QA exclusion.
 * It must only be used when the holder being viewed is itself a QA fixture
 * holder (`features.qa_e2e === true`); the roster is already scoped to that
 * holder's own enrollments, so a real holder's roster is unaffected.
 */
export function isQaFixtureRosterProfile(
  profile: Parameters<typeof isProductionRosterProfile>[0],
): boolean {
  return (
    typeof profile.id === 'string' &&
    profile.id.length > 0 &&
    (LEARNER_ROSTER_ROLES as readonly string[]).includes(String(profile.role || '').toLowerCase())
  );
}
