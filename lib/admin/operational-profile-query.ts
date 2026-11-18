/** Explicit test identities only. Real applicants remain visible and no account is deleted. */
const TEST_EMAIL_PATTERNS = [
  '%@qa.invalid',
  '%.test',
  '%.internal',
  '%@example.com',
  '%@elevatetest.com',
  '%@elevate-test.dev',
  '%@test.elevateforhumanity.org',
  'verify-bot+%@elevateforhumanity.org',
  'cosmo.test@elevateforhumanity.org',
  'preview@elevateforhumanity.org',
  'admin-temp@elevateforhumanity.org',
  'upload-test@resend.dev',
  'e2e-upload-%@test.com',
  'upload-noprofile-%@test.com',
  'upload-test-%@test.com',
];
const TEST_NAMES = [
  'test admin',
  'upload tester',
  'final tester',
  'v2 test',
  'dev studio',
  'temp admin',
  'preview student',
  'verify bot',
];

export function isTestOrAuditProfile(profile: {
  email?: string | null;
  full_name?: string | null;
}) {
  const email = String(profile.email ?? '')
    .trim()
    .toLowerCase();
  const name = String(profile.full_name ?? '')
    .trim()
    .toLowerCase();
  const matchesEmail = TEST_EMAIL_PATTERNS.some((pattern) => {
    const escaped = pattern
      .split('%')
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('.*');
    return new RegExp(`^${escaped}$`, 'i').test(email);
  });
  return matchesEmail || name.startsWith('[qa') || TEST_NAMES.includes(name);
}

/** Apply identical exclusions before counts and pagination, preserving missing optional fields. */
export function excludeQaProfiles<T extends { or: (filters: string) => T }>(query: T): T {
  return query
    .or(
      `email.is.null,and(${TEST_EMAIL_PATTERNS.map((pattern) => `email.not.ilike.${pattern}`).join(',')})`,
    )
    .or(
      `full_name.is.null,and(full_name.not.ilike.[QA%,${TEST_NAMES.map((name) => `full_name.not.ilike.${JSON.stringify(name)}`).join(',')})`,
    );
}
