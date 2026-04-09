import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { handleRoute } from '@/lib/api/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Checks migration status. Requires admin/super_admin/staff session.
async function _POST(request: NextRequest) {
  return handleRoute(async () => {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

    await apiRequireAdmin(request);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Missing configuration' }, { status: 500 });
    }

    // Create admin client
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    });

    const results: { migration: string; status: string; error?: string }[] = [];

    // Check tables
    const tables = ['program_announcements', 'program_discussions', 'program_discussion_replies'];
    
    for (const table of tables) {
      try {
        const { error: checkError } = await supabase
          .from(table)
          .select('id')
          .limit(1);

        if (checkError?.code === 'PGRST205') {
          results.push({
            migration: table,
            status: 'REQUIRES_MANUAL',
            error: 'Table must be created via Supabase SQL Editor'
          });
        } else if (checkError?.code === '42501') {
          results.push({
            migration: table,
            status: 'EXISTS',
            error: 'Table exists (RLS blocking)'
          });
        } else {
          results.push({
            migration: table,
            status: 'EXISTS'
          });
        }
      } catch (e: any) {
        results.push({
          migration: table,
          status: 'ERROR',
          error: 'Operation failed'
        });
      }
    }

    const allExist = results.every(r => r.status === 'EXISTS');
    const requiresManual = results.some(r => r.status === 'REQUIRES_MANUAL');

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
        '/supabase/migrations/20260116_program_discussions.sql'
      ]
    });
  });
}
export const POST = withApiAudit('/api/admin/run-migrations', _POST);
