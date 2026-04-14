/**
 * Applies RLS lockdown for course_lessons, lms_lessons, course_modules, courses.
 * Uses the Supabase Management API SQL endpoint which accepts a personal access token.
 *
 * Run: SUPABASE_ACCESS_TOKEN=<your-pat> pnpm tsx --env-file=.env.local scripts/apply-rls-lockdown.ts
 *
 * Get your PAT from: https://supabase.com/dashboard/account/tokens
 */

const PROJECT_REF = 'cuxzzpsyufcewtmicszk';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error('SUPABASE_ACCESS_TOKEN is required.');
  console.error('Get one from: https://supabase.com/dashboard/account/tokens');
  console.error('Run: SUPABASE_ACCESS_TOKEN=<token> pnpm tsx --env-file=.env.local scripts/apply-rls-lockdown.ts');
  process.exit(1);
}

const SQL_ENDPOINT = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

async function sql(query: string, label: string) {
  const res = await fetch(SQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ query }),
  });
  const json = await res.json() as any;
  if (!res.ok || json.error || json.message) {
    console.error(`✗ ${label}:`, json.error ?? json.message ?? json);
    return false;
  }
  console.log(`✓ ${label}`);
  return true;
}

async function main() {
  console.log('Applying RLS lockdown migration...\n');

  // ── course_lessons ──────────────────────────────────────────────────────────
  await sql(`REVOKE ALL ON public.course_lessons FROM anon`, 'revoke anon from course_lessons');
  await sql(`REVOKE ALL ON public.course_lessons FROM public`, 'revoke public from course_lessons');
  await sql(`GRANT SELECT ON public.course_lessons TO authenticated`, 'grant authenticated course_lessons');
  await sql(`GRANT ALL ON public.course_lessons TO service_role`, 'grant service_role course_lessons');

  for (const name of [
    'Anyone can read course lessons',
    'Authenticated users can read course lessons',
    'Users can read published course lessons',
    'course_lessons_select',
    'Authenticated read published lessons',
    'course_lessons_authenticated_read',
    'Admins and instructors can read all course lessons',
    'Service role lessons',
    'course_lessons_service_role',
    'course_lessons_admin_read',
  ]) {
    await sql(`DROP POLICY IF EXISTS "${name}" ON public.course_lessons`, `drop policy: ${name}`);
  }

  await sql(`
    CREATE POLICY "course_lessons_authenticated_read"
    ON public.course_lessons FOR SELECT TO authenticated
    USING (
      auth.role() = 'authenticated'
      AND EXISTS (
        SELECT 1 FROM public.course_modules cm
        JOIN public.courses c ON c.id = cm.course_id
        WHERE cm.id = course_lessons.module_id
          AND c.status = 'published'
          AND c.is_active = true
      )
    )
  `, 'create course_lessons_authenticated_read policy');

  await sql(`
    CREATE POLICY "course_lessons_admin_read"
    ON public.course_lessons FOR SELECT TO authenticated
    USING (
      auth.role() = 'authenticated'
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN ('admin', 'super_admin', 'instructor', 'staff')
      )
    )
  `, 'create course_lessons_admin_read policy');

  await sql(`
    CREATE POLICY "course_lessons_service_role"
    ON public.course_lessons FOR ALL TO service_role
    USING (true) WITH CHECK (true)
  `, 'create course_lessons_service_role policy');

  // ── lms_lessons ─────────────────────────────────────────────────────────────
  await sql(`REVOKE ALL ON public.lms_lessons FROM anon`, 'revoke anon from lms_lessons');
  await sql(`REVOKE ALL ON public.lms_lessons FROM public`, 'revoke public from lms_lessons');
  await sql(`GRANT SELECT ON public.lms_lessons TO authenticated, service_role`, 'grant authenticated lms_lessons');

  // ── course_modules ──────────────────────────────────────────────────────────
  await sql(`REVOKE ALL ON public.course_modules FROM anon`, 'revoke anon from course_modules');
  await sql(`REVOKE ALL ON public.course_modules FROM public`, 'revoke public from course_modules');
  await sql(`GRANT SELECT ON public.course_modules TO authenticated`, 'grant authenticated course_modules');
  await sql(`GRANT ALL ON public.course_modules TO service_role`, 'grant service_role course_modules');
  await sql(`ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY`, 'enable RLS course_modules');

  for (const name of ['course_modules_authenticated_read', 'course_modules_admin_read', 'course_modules_service_role']) {
    await sql(`DROP POLICY IF EXISTS "${name}" ON public.course_modules`, `drop policy: ${name}`);
  }

  await sql(`
    CREATE POLICY "course_modules_authenticated_read"
    ON public.course_modules FOR SELECT TO authenticated
    USING (
      auth.role() = 'authenticated'
      AND EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = course_modules.course_id
          AND c.status = 'published'
          AND c.is_active = true
      )
    )
  `, 'create course_modules_authenticated_read policy');

  await sql(`
    CREATE POLICY "course_modules_admin_read"
    ON public.course_modules FOR SELECT TO authenticated
    USING (
      auth.role() = 'authenticated'
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN ('admin', 'super_admin', 'instructor', 'staff')
      )
    )
  `, 'create course_modules_admin_read policy');

  await sql(`
    CREATE POLICY "course_modules_service_role"
    ON public.course_modules FOR ALL TO service_role
    USING (true) WITH CHECK (true)
  `, 'create course_modules_service_role policy');

  // ── courses ─────────────────────────────────────────────────────────────────
  await sql(`GRANT SELECT ON public.courses TO anon`, 'grant anon courses');
  await sql(`GRANT SELECT ON public.courses TO authenticated`, 'grant authenticated courses');
  await sql(`GRANT ALL ON public.courses TO service_role`, 'grant service_role courses');

  for (const name of [
    'Anyone can read courses', 'Public can read published courses',
    'Public read published courses', 'courses_select',
    'Anon can read published catalog courses',
    'Authenticated users can read published courses',
    'Admins can read all courses', 'Service role courses',
    'courses_anon_catalog', 'courses_authenticated_read',
    'courses_admin_read', 'courses_service_role',
  ]) {
    await sql(`DROP POLICY IF EXISTS "${name}" ON public.courses`, `drop policy: ${name}`);
  }

  await sql(`
    CREATE POLICY "courses_anon_catalog"
    ON public.courses FOR SELECT TO anon
    USING (status = 'published' AND is_active = true)
  `, 'create courses_anon_catalog policy');

  await sql(`
    CREATE POLICY "courses_authenticated_read"
    ON public.courses FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated' AND status = 'published' AND is_active = true)
  `, 'create courses_authenticated_read policy');

  await sql(`
    CREATE POLICY "courses_admin_read"
    ON public.courses FOR SELECT TO authenticated
    USING (
      auth.role() = 'authenticated'
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN ('admin', 'super_admin', 'instructor', 'staff')
      )
    )
  `, 'create courses_admin_read policy');

  await sql(`
    CREATE POLICY "courses_service_role"
    ON public.courses FOR ALL TO service_role
    USING (true) WITH CHECK (true)
  `, 'create courses_service_role policy');

  console.log('\nMigration complete. Running verification...\n');
  await verify();
}

async function verify() {
  const { createClient } = await import('@supabase/supabase-js');
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );

  const checks: Array<{ table: string; expectBlocked: boolean }> = [
    { table: 'course_lessons', expectBlocked: true },
    { table: 'lms_lessons',    expectBlocked: true },
    { table: 'course_modules', expectBlocked: true },
    { table: 'courses',        expectBlocked: false },
  ];

  let allPassed = true;
  for (const { table, expectBlocked } of checks) {
    const { count, error } = await anon.from(table).select('id', { count: 'exact', head: true });
    const blocked = error?.code === 'PGRST301' || count === 0;
    const pass = blocked === expectBlocked;
    allPassed = allPassed && pass;
    const status = pass ? '✓' : '✗';
    const detail = error ? `blocked (${error.code})` : `${count} rows accessible`;
    const expectation = expectBlocked ? 'should be blocked' : 'should be accessible';
    console.log(`${status} ${table} anon: ${detail} — ${expectation}`);
  }

  console.log(allPassed ? '\n✓ All checks passed.' : '\n✗ Some checks failed — review above.');
}

main().catch(console.error);
