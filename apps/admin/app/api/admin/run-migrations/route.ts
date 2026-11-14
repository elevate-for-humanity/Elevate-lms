import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { hydrateProcessEnv } from '@/lib/secrets';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { handleRoute } from '@/lib/api/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Checks migration status. Requires admin/admin/staff session.
async function _POST(request: NextRequest) {
  return handleRoute(async () => {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

    const auth = await apiRequireAdmin(request);
    if (auth.error) return auth.error;
    await hydrateProcessEnv();
    const supabase = await requireAdminClient();

    const results: { migration: string; status: string; error?: string }[] = [];

    // Check tables
    const tables = ['program_announcements', 'program_discussions', 'program_discussion_replies'];

    for (const table of tables) {
      try {
        const { error: checkError } = await supabase.from(table).select('id').limit(1);

        if (checkError?.code === 'PGRST205') {
          results.push({
            migration: table,
            status: 'REQUIRES_MANUAL',
            error: 'Table must be created via Supabase SQL Editor',
          });
        } else if (checkError?.code === '42501') {
          results.push({
            migration: table,
            status: 'EXISTS',
            error: 'Table exists (RLS blocking)',
          });
        } else {
          results.push({
            migration: table,
            status: 'EXISTS',
          });
        }
      } catch (e: any) {
        results.push({
          migration: table,
          status: 'ERROR',
          error: 'Operation failed',
        });
      }
    }

    const allExist = results.every((r) => r.status === 'EXISTS');
    const requiresManual = results.some((r) => r.status === 'REQUIRES_MANUAL');

    return NextResponse.json({
      success: allExist,
      requiresManual,
      message: requiresManual
        ? 'Some tables need to be created manually in Supabase SQL Editor'
        : allExist
          ? 'All migrations applied'
          : 'Migration check complete',
      results,
      sqlFiles: [
        '/supabase/migrations/20260116_program_announcements.sql',
        '/supabase/migrations/20260116_program_discussions.sql',
      ],
    });
  });
}
export const POST = withApiAudit('/api/admin/run-migrations', _POST);
