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
  return /^qa-portal-e2e-[0-9]+-holder-(?:active|completed)-student@qa\.invalid$/.test(email);
}
