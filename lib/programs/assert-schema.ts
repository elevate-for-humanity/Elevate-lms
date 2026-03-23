/**
 * Schema assertions for the program creation pipeline.
 *
 * Verifies that the live DB has the columns, FKs, and view that
 * createAndPublishProgram() depends on. Throws with a full list of
 * failures — does not stop on first error.
 *
 * Requires SUPABASE_MANAGEMENT_TOKEN (personal access token) to query
 * information_schema and pg_constraint via the Management API.
 *
 * Usage:
 *   await assertPipelineSchema();  // throws on any failure, silent on pass
 */

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF ?? 'cuxzzpsyufcewtmicszk';
const MGMT_TOKEN  = process.env.SUPABASE_MANAGEMENT_TOKEN;

// Required columns: [table, column, mustBeNotNull]
const REQUIRED_COLUMNS: [string, string, boolean][] = [
  ['programs',               'slug',        true],
  ['programs',               'title',       true],
  ['programs',               'category',    true],
  ['programs',               'has_lms_course', false],
  ['courses',                'slug',        true],
  ['courses',                'title',       true],
  ['courses',                'status',      true],
  // course_modules.course_id has a FK but no explicit NOT NULL constraint in the live schema
  ['course_modules',         'course_id',   false],
  ['course_modules',         'title',       true],
  ['course_lessons',         'course_id',   true],
  ['course_lessons',         'slug',        true],
  ['course_lessons',         'title',       true],
  ['course_lessons',         'lesson_type', true],
  ['course_lessons',         'order_index', true],
  ['course_lessons',         'is_required', true],
  ['module_completion_rules','course_id',   true],
  ['module_completion_rules','module_id',   true],
];

// Required FK constraints: [table, constraint_name]
const REQUIRED_FKS: [string, string][] = [
  ['course_modules', 'course_modules_course_id_fkey'],
  ['course_lessons', 'course_lessons_course_id_fkey'],
  ['course_lessons', 'course_lessons_module_id_fkey'],
];

async function runSql(sql: string): Promise<Record<string, unknown>[]> {
  if (!MGMT_TOKEN) {
    throw new Error(
      'assertPipelineSchema: SUPABASE_MANAGEMENT_TOKEN is not set. ' +
      'Set it to a Supabase personal access token.'
    );
  }
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${MGMT_TOKEN}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ query: sql }),
    }
  );
  const body = await res.json() as Record<string, unknown>[] | { message: string };
  if (!res.ok || 'message' in body) {
    throw new Error(`SQL query failed: ${(body as { message: string }).message}`);
  }
  return body as Record<string, unknown>[];
}

export async function assertPipelineSchema(): Promise<void> {
  const failures: string[] = [];

  // Column checks
  const tables = [...new Set(REQUIRED_COLUMNS.map(([t]) => t))];
  for (const table of tables) {
    let rows: Record<string, unknown>[];
    try {
      rows = await runSql(
        `SELECT column_name, is_nullable FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = '${table}'`
      );
    } catch (e) {
      failures.push(`could not query columns for ${table}: ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }
    const cols = new Map(rows.map((r) => [r.column_name as string, r.is_nullable as string]));
    for (const [t, col, mustBeNotNull] of REQUIRED_COLUMNS) {
      if (t !== table) continue;
      if (!cols.has(col)) {
        failures.push(`${table}.${col} — column missing`);
      } else if (mustBeNotNull && cols.get(col) === 'YES') {
        failures.push(`${table}.${col} — expected NOT NULL but is nullable`);
      }
    }
  }

  // FK checks
  for (const [table, constraintName] of REQUIRED_FKS) {
    let rows: Record<string, unknown>[];
    try {
      rows = await runSql(
        `SELECT conname FROM pg_constraint
         WHERE conrelid = 'public.${table}'::regclass AND conname = '${constraintName}'`
      );
    } catch (e) {
      failures.push(`could not check FK ${constraintName}: ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }
    if (!rows.length) failures.push(`FK missing: ${table}.${constraintName}`);
  }

  // lms_lessons view — must exist and project from course_lessons
  let viewRows: Record<string, unknown>[] = [];
  try {
    viewRows = await runSql(
      `SELECT viewname, definition FROM pg_views
       WHERE schemaname = 'public' AND viewname = 'lms_lessons'`
    );
  } catch (e) {
    failures.push(`could not check lms_lessons view: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (!viewRows.length) {
    failures.push('lms_lessons view — missing');
  } else if (!(viewRows[0].definition as string ?? '').includes('course_lessons')) {
    failures.push(
      'lms_lessons view — does not project from course_lessons ' +
      '(apply migration 20260504000001_lms_lessons_canonical_view.sql)'
    );
  }

  if (failures.length > 0) {
    throw new Error(
      `Pipeline schema assertions failed (${failures.length} issue${failures.length > 1 ? 's' : ''}):\n` +
      failures.map((f) => `  - ${f}`).join('\n') +
      "\n\nApply pending migrations and run: NOTIFY pgrst, 'reload schema';"
    );
  }
}
