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

/** Admit only the holder's disposable student while exercising the isolated QA database. */
export function isIsolatedQaHolderRosterProfile(
  profile: Parameters<typeof isProductionRosterProfile>[0],
  context: {
    supabaseUrl?: string;
    holderFeatures?: { qa_e2e?: unknown; isolated?: unknown; qa_run_id?: unknown } | null;
  },
): boolean {
  try {
    const url = new URL(context.supabaseUrl || '');
    if (url.origin !== 'https://isdgjcdabhxxozarmxta.supabase.co' || url.username || url.password)
      return false;
  } catch {
    return false;
  }
  const features = context.holderFeatures;
  const runId = features?.qa_run_id;
  if (features?.qa_e2e !== true || features.isolated !== true ||
      typeof runId !== 'string' || !/^[a-zA-Z0-9-]{1,100}$/.test(runId)) return false;
  return (
    typeof profile.id === 'string' &&
    /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(profile.id) &&
    (LEARNER_ROSTER_ROLES as readonly string[]).includes(String(profile.role || '').toLowerCase()) &&
    /^\[QA E2E\]/i.test(String(profile.full_name || '').trim()) &&
    String(profile.email || '').trim().toLowerCase() ===
      `qa-portal-e2e-${runId.toLowerCase()}-holder-student@qa.invalid`
  );
}
