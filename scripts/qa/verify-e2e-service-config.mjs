/**
 * Fail closed before monorepo browser E2E when GitHub test-service
 * configuration cannot exercise the real authenticated user journeys.
 * This validates test infrastructure only; it never reads/logs secret values
 * or contacts (or writes to) Supabase/Google production.
 */
export function auditE2EServiceConfiguration(env = process.env) {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'TEST_ADMIN_EMAIL', 'TEST_ADMIN_PASSWORD',
    'TEST_STUDENT_EMAIL', 'TEST_STUDENT_PASSWORD',
    'TEST_PROGRAM_HOLDER_EMAIL', 'TEST_PROGRAM_HOLDER_PASSWORD',
    'E2E_ADMIN_EMAIL', 'E2E_ADMIN_PASSWORD',
    'E2E_PROGRAM_HOLDER_EMAIL', 'E2E_PROGRAM_HOLDER_PASSWORD',
    'E2E_HOST_SHOP_EMAIL', 'E2E_HOST_SHOP_PASSWORD',
    'E2E_APPRENTICE_EMAIL', 'E2E_APPRENTICE_PASSWORD',
    'E2E_EMPLOYER_EMAIL', 'E2E_EMPLOYER_PASSWORD',
    'E2E_INSTRUCTOR_EMAIL', 'E2E_INSTRUCTOR_PASSWORD',
    'E2E_STAFF_EMAIL', 'E2E_STAFF_PASSWORD',
    'E2E_CASE_MANAGER_EMAIL', 'E2E_CASE_MANAGER_PASSWORD',
  ];
  const missing = required.filter(key => !String(env[key] ?? '').trim());
  const failures = [];
  if (missing.length) failures.push('E2E_REQUIRED_TEST_CONFIGURATION_MISSING: ' + missing.join(', '));
  const url = String(env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
  if (url) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.supabase.co')) {
        failures.push('E2E_SUPABASE_TEST_URL_INVALID');
      }
      // The broad E2E suite includes tests that write applications and user
      // data via service role. Prevent a PR's local dev servers from silently
      // modifying the live student database. Production acceptance requires
      // its *separate*, disposable-identity, data-scoped workflow.
      if (parsed.hostname === 'cuxzzpsyufcewtmicszk.supabase.co') {
        failures.push('E2E_LOCAL_TESTS_TARGET_PRODUCTION_SUPABASE');
      }
    } catch {
      failures.push('E2E_SUPABASE_TEST_URL_INVALID');
    }
  }
  for (const key of ['PLAYWRIGHT_BASE_URL','PLAYWRIGHT_MARKETING_URL','PLAYWRIGHT_ADMIN_URL','PLAYWRIGHT_LMS_URL']) {
    if (String(env[key] ?? '').trim()) {
      failures.push('E2E_LOCAL_SERVER_ORIGIN_OVERRIDE_UNEXPECTED: ' + key);
    }
  }
  return {ok:failures.length===0,missing,failures};
}

if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) {
  const result = auditE2EServiceConfiguration();
  if (!result.ok) {
    for (const issue of result.failures) console.error('[e2e-preflight] ' + issue);
    console.error('[e2e-preflight] No browser execution or production data mutation was attempted.');
    process.exitCode = 1;
  } else {
    console.info('[e2e-preflight] Isolated QA origin, credentials, and local three-service routing: configured.');
  }
}
