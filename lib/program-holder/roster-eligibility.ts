// Branch refreshed to pick up main (71e31a22): /apply/student E2E fix + Dockerfile.google-lms.
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
    !domain.endsWith('.test') &&
    // roster.qa.invalid is the one reserved domain allowed through: the QA
    // roster fixture preparer rewrites a verified disposable fixture profile
    // to it so the learner reads as genuine on its own holder's roster.
    // Every other .invalid identity stays excluded.
    !(domain.endsWith('.invalid') && domain !== 'roster.qa.invalid')
  );
}

// Permit only the two explicitly provisioned, disposable holder-roster personas
// when the server is connected to the independently isolated QA project.
// Production filtering remains strict even when TEST_MODE is accidentally set.
export function isIsolatedQaProgramHolderRosterContext(config: {
  supabaseUrl?: string;
  testMode?: string;
}): boolean {
  if (config.testMode !== 'true') return false;
  try {
    return new URL(config.supabaseUrl || '').origin ===
      'https://isdgjcdabhxxozarmxta.supabase.co';
  } catch {
    return false;
  }
}

export function isLearnerRosterProfile(
  profile: Parameters<typeof isProductionRosterProfile>[0],
  options: { includeIsolatedQaFixtures?: boolean } = {},
): boolean {
  if (!(LEARNER_ROSTER_ROLES as readonly string[]).includes(String(profile.role || '').toLowerCase())) {
    return false;
  }
  if (isProductionRosterProfile(profile)) return true;
  if (!options.includeIsolatedQaFixtures || typeof profile.id !== 'string' || !profile.id) {
    return false;
  }
  const email = String(profile.email || '').trim().toLowerCase();
  // The provisioner uses a numeric fallback or the CI run-attempt-shard ID.
  return /^qa-portal-e2e-[0-9]+(?:-[0-9]+-[0-9]+)?-holder-(?:active|completed)-student@qa\.invalid$/.test(email);
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

