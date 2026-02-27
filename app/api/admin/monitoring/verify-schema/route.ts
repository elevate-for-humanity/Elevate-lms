import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if audit_logs table exists and has required columns
    const checks = {
      tableExists: false,
      requiredColumns: {
        id: false,
        created_at: false,
        action_type: false,
        description: false,
        user_id: false,
        ip_address: false,
        details: false,
      },
      canInsert: false,
      canQuery: false,
    };

    // Test if we can query the table
    try {
      const { data, error } = await db
        .from('audit_logs')
        .select('*')
        .limit(1);

      if (!error) {
        checks.tableExists = true;
        checks.canQuery = true;

        // Check which columns exist by trying to select them
        if (data && data.length > 0) {
          const firstRow = data[0];
          checks.requiredColumns.id = 'id' in firstRow;
          checks.requiredColumns.created_at = 'created_at' in firstRow;
          checks.requiredColumns.action_type = 'action_type' in firstRow;
          checks.requiredColumns.description = 'description' in firstRow;
          checks.requiredColumns.user_id = 'user_id' in firstRow;
          checks.requiredColumns.ip_address = 'ip_address' in firstRow;
          checks.requiredColumns.details = 'details' in firstRow;
        } else {
          // Table is empty, assume all columns exist if we can query
          checks.requiredColumns = {
            id: true,
            created_at: true,
            action_type: true,
            description: true,
            user_id: true,
            ip_address: true,
            details: true,
          };
        }
      }
    } catch (error) {
      logger.error('Error checking audit_logs:', error);
    }

    // Test if we can insert
    try {
      const { error } = await db
        .from('audit_logs')
        .insert({
          action_type: 'test',
          description: 'Schema verification test',
          details: { test: true },
        });

      if (!error) {
        checks.canInsert = true;

        // Clean up test record
        await db
          .from('audit_logs')
          .delete()
          .eq('action_type', 'test')
          .eq('description', 'Schema verification test');
      }
    } catch (error) {
      logger.error('Error testing insert:', error);
    }

    // Determine overall status
    const allColumnsExist = Object.values(checks.requiredColumns).every(v => v);
    const isReady = checks.tableExists && allColumnsExist && checks.canInsert && checks.canQuery;

    return NextResponse.json({
      status: isReady ? 'ready' : 'needs_setup',
      checks,
      message: isReady 
        ? 'audit_logs table is ready for monitoring'
        : 'audit_logs table needs additional setup',
      recommendations: !isReady ? [
        !checks.tableExists && 'Create audit_logs table',
        !allColumnsExist && 'Add missing columns to audit_logs table',
        !checks.canInsert && 'Grant INSERT permission on audit_logs table',
        !checks.canQuery && 'Grant SELECT permission on audit_logs table',
      ].filter(Boolean) : [],
    });
  } catch (error) {
    logger.error('Schema verification error:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Internal server error',
    }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/admin/monitoring/verify-schema', _GET);
