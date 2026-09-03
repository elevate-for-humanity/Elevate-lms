import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const resources = [
  { resource: 'tasks', endpoint: '/api/admin/dev-studio/tasks', tables: ['ai_tasks'] },
  { resource: 'workflows', endpoint: '/api/admin/workflows/unified', tables: ['workflows', 'workflow_triggers', 'workflow_steps', 'workflow_runs'] },
  { resource: 'evaluations', endpoint: '/api/admin/dev-studio/evaluations', tables: ['ai_eval_runs'] },
  { resource: 'deployments', endpoint: '/api/admin/dev-studio/deployments', tables: ['ai_deployments'] },
  { resource: 'services', endpoint: '/api/admin/dev-studio/services', tables: ['ai_deployments'] },
  { resource: 'containers', endpoint: '/api/admin/dev-studio/containers', tables: ['dev_container_sessions'] },
  { resource: 'memory', endpoint: '/api/admin/dev-studio/memory', tables: ['ai_memory'] },
  { resource: 'repository', endpoint: '/api/admin/dev-studio/repository', tables: ['ai_repo_index'] },
  { resource: 'claims', endpoint: '/api/admin/dev-studio/claims', tables: ['dev_studio_claim_evidence'] },
  { resource: 'course-jobs', endpoint: '/api/admin/dev-studio/course-jobs', tables: ['course_factory_jobs'] },
  { resource: 'courses', endpoint: '/api/admin/courses', tables: ['courses', 'course_modules', 'course_lessons'] },
  { resource: 'media', endpoint: '/api/admin/dev-studio/media', tables: ['media_jobs', 'course_media_assets', 'course_videos'] },
] as const;

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  const tableNames = [...new Set(resources.flatMap((item) => [...item.tables]))];
  const checks = await Promise.all(
    tableNames.map(async (table) => {
      const { count, error } = await db.from(table).select('*', { count: 'exact', head: true });
      return [table, { active: !error, count: count ?? 0, error: error ? 'unavailable' : null }] as const;
    }),
  );
  const tableStatus = Object.fromEntries(checks);

  const mappings = resources.map((item) => ({
    ...item,
    active: item.tables.every((table) => tableStatus[table]?.active),
    row_count: item.tables.reduce((sum, table) => sum + (tableStatus[table]?.count ?? 0), 0),
  }));

  return NextResponse.json(
    {
      status: mappings.every((item) => item.active) ? 'healthy' : 'degraded',
      mappings,
      tables: tableStatus,
      checked_at: new Date().toISOString(),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
