import 'server-only';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { WORKFORCE_ACCESS_ROLES, isPlatformOversight, learnerId } from './records';

export async function allRows(makeQuery: () => any): Promise<any[]> {
  const rows: any[] = [];
  for (let offset = 0; ; offset += 500) {
    const result = await makeQuery()
      .order('id')
      .range(offset, offset + 499);
    if (result.error)
      throw new Error(`WORKFORCE_QUERY_FAILED:${result.error.code ?? 'unavailable'}`);
    rows.push(...(result.data ?? []));
    if ((result.data ?? []).length < 500) return rows;
  }
}

export async function relatedRows(
  db: any,
  table: string,
  fields: string,
  column: string,
  ids: string[],
) {
  const result: any[] = [];
  const unique = [...new Set(ids)];
  for (let offset = 0; offset < unique.length; offset += 100) {
    result.push(
      ...(await allRows(() =>
        db
          .from(table)
          .select(fields)
          .in(column, unique.slice(offset, offset + 100)),
      )),
    );
  }
  return result;
}

/** Service access stays server-only. Every non-platform role is scoped before records are loaded. */
export async function getWorkforceContext() {
  const auth = await requireRole(WORKFORCE_ACCESS_ROLES);
  if (auth.profile.is_active === false || auth.profile.suspended === true)
    throw new Error('WORKFORCE_ACCOUNT_INACTIVE');
  const db = await requireAdminClient();
  const global = isPlatformOversight(auth.effectiveRoles);
  let ids: string[] | null = null;
  let tenantId: string | null = null;
  if (!global && auth.effectiveRoles.some((role) => ['staff', 'org_admin'].includes(role))) {
    tenantId = auth.profile.tenant_id ?? null;
    if (!tenantId) throw new Error('WORKFORCE_TENANT_REQUIRED');
  } else if (!global) {
    const assignments = await allRows(() =>
      db
        .from('case_manager_assignments')
        .select('id,application_id')
        .eq('case_manager_id', auth.user.id),
    );
    const applications = await relatedRows(
      db,
      'applications',
      'id,user_id',
      'id',
      assignments.map((row) => row.application_id),
    );
    const wioa = await allRows(() =>
      db.from('wioa_participants').select('id,user_id').eq('case_manager_id', auth.user.id),
    );
    ids = [
      ...new Set([...applications, ...wioa].map((row) => row.user_id).filter(Boolean)),
    ] as string[];
  }
  return { ...auth, db, global, ids, tenantId };
}

export type WorkforceContext = Awaited<ReturnType<typeof getWorkforceContext>>;

export async function getWorkforceEnrollments(ctx: WorkforceContext) {
  const fields =
    'id,user_id,student_id,program_id,enrollment_state,enrolled_at,started_at,completed_at,at_risk,tenant_id,funding_source,eligibility_status,training_start_date,training_end_date';
  if (ctx.ids !== null && !ctx.ids.length) return [];
  const base = () => {
    let query = ctx.db.from('program_enrollments').select(fields);
    if (ctx.tenantId) query = query.eq('tenant_id', ctx.tenantId);
    return query;
  };
  let rows: any[];
  if (ctx.ids !== null) {
    rows = [];
    for (let offset = 0; offset < ctx.ids.length; offset += 100) {
      const batch = ctx.ids.slice(offset, offset + 100);
      rows.push(...(await allRows(() => base().in('user_id', batch))));
      rows.push(...(await allRows(() => base().is('user_id', null).in('student_id', batch))));
    }
  } else rows = await allRows(base);
  const profileIds = [...new Set(rows.map(learnerId).filter(Boolean))] as string[];
  const programIds = [...new Set(rows.map((row) => row.program_id).filter(Boolean))] as string[];
  const [profiles, programs] = await Promise.all([
    relatedRows(ctx.db, 'profiles', 'id,full_name,email', 'id', profileIds),
    relatedRows(ctx.db, 'programs', 'id,title,status', 'id', programIds),
  ]);
  const profileMap = new Map(profiles.map((row) => [row.id, row]));
  const programMap = new Map(programs.map((row) => [row.id, row]));
  return rows
    .map((row) => ({
      ...row,
      profile: profileMap.get(learnerId(row)),
      program: programMap.get(row.program_id),
    }))
    .sort(
      (a, b) =>
        String(b.enrolled_at ?? '').localeCompare(String(a.enrolled_at ?? '')) ||
        a.id.localeCompare(b.id),
    );
}

export async function getWorkforceWorkspace() {
  const ctx = await getWorkforceContext();
  const enrollments = await getWorkforceEnrollments(ctx);
  const userIds = [...new Set(enrollments.map(learnerId).filter(Boolean))] as string[];
  return { ctx, enrollments, userIds };
}

export async function workforceRecords(
  ctx: WorkforceContext,
  table: string,
  fields: string,
  column: string,
  ids: string[],
) {
  if (ctx.global) return allRows(() => ctx.db.from(table).select(fields));
  return relatedRows(ctx.db, table, fields, column, ids);
}
