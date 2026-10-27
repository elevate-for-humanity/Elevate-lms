const TEST_EMAIL_DOMAINS = new Set([
  'qa.invalid',
  'elevatetest.com',
  'elevate-test.dev',
  'test.elevateforhumanity.org',
  'example.com',
]);

export function isLearnerRosterProfile(profile: {
  id?: unknown;
  role?: unknown;
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
    ['student', 'learner', 'apprentice', 'barber_apprentice', 'cosmetology_apprentice'].includes(
      String(profile.role || '').toLowerCase(),
    ) &&
    !TEST_EMAIL_DOMAINS.has(domain) &&
    !domain.endsWith('.test')
  );
}
