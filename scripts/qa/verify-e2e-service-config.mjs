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
  // This gate certifies all three apps. A hidden app-selection override would
  // silently omit whole mandatory suites and misrepresent green acceptance.
  if (String(env.PLAYWRIGHT_APPS ?? '').trim()) {
    failures.push('E2E_FULL_SUITE_APP_SELECTION_OVERRIDE_UNEXPECTED');
  }
  for (const key of ['PLAYWRIGHT_BASE_URL','PLAYWRIGHT_MARKETING_URL','PLAYWRIGHT_ADMIN_URL','PLAYWRIGHT_LMS_URL']) {
    if (String(env[key] ?? '').trim()) {
      failures.push('E2E_LOCAL_SERVER_ORIGIN_OVERRIDE_UNEXPECTED: ' + key);
    }
  }
  return {ok:failures.length===0,missing,failures};
}

/** Read schema only; limit(0) never fetches applicant or document records. */
export async function auditE2EApplicationDocumentSchema(db) {
  const contracts = {
    documents: 'id,user_id,owner_type,owner_id,document_type,file_name,file_size,file_size_bytes,file_url,file_path,mime_type,status,verification_status,verified,rejection_reason,title,requirement_id,metadata,created_at,updated_at',
    document_requirements: 'id,role,document_type,name,description,instructions,is_required,required,accepted_formats,max_file_size,due_stage,program_id',
  };
  const results = await Promise.all(Object.entries(contracts).map(async ([table, columns]) => {
    const { error } = await db.from(table).select(columns).limit(0);
    return error ? `E2E_APPLICATION_DOCUMENT_SCHEMA_INVALID: ${table} (${error.code || 'query failed'})` : null;
  }));
  const failures = results.filter(Boolean);
  return { ok: failures.length === 0, failures };
}

if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) {
  const result = auditE2EServiceConfiguration();
  if (!result.ok) {
    for (const issue of result.failures) console.error('[e2e-preflight] ' + issue);
    console.error('[e2e-preflight] No browser execution or production data mutation was attempted.');
    process.exitCode = 1;
  } else {
    console.info('[e2e-preflight] Isolated QA origin, credentials, and local three-service routing: configured.');
    const { createClient } = await import('@supabase/supabase-js');
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const schema = await auditE2EApplicationDocumentSchema(db);
    if (!schema.ok) {
      for (const issue of schema.failures) console.error('[e2e-preflight] ' + issue);
      process.exitCode = 1;
    } else {
      console.info('[e2e-preflight] Application document list and upload schema: verified without reading records.');
    }
  }
}
