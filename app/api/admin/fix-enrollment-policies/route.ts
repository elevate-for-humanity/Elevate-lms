import { safeInternalError } from '@/lib/api/safe-error';
import { requireAdmin } from '@/lib/auth';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/with-auth';
import { logger } from '@/lib/logger';
import { logAdminAudit, AdminAction, BULK_ENTITY_ID } from '@/lib/admin/audit-log';
import { writeApiAuditEvent } from '@/lib/audit/api-audit';
import { applyRateLimit } from '@/lib/api/withRateLimit';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

export const POST = withAuth(
  async (req: NextRequest, ctx) => {
    const auditBase = { endpoint: '/api/admin/fix-enrollment-policies', method: 'POST', actor_type: 'user' as const, actor_id: ctx?.user?.id ?? null };
    try {
      const supabase = await createClient();

      const fixPoliciesSQL = `
        -- Drop existing policies if they exist to avoid conflicts
        DROP POLICY IF EXISTS "Admins can enroll users" ON training_enrollments;
        DROP POLICY IF EXISTS "Admins can update enrollments" ON training_enrollments;
        DROP POLICY IF EXISTS "Admins can delete enrollments" ON training_enrollments;

        -- Allow admins to insert enrollments for any user
        CREATE POLICY "Admins can enroll users"
          ON training_enrollments FOR INSERT
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM profiles
              WHERE profiles.id = auth.uid()
              AND profiles.role IN ('admin', 'super_admin')
            )
          );

        -- Allow admins to update any enrollment
        CREATE POLICY "Admins can update enrollments"
          ON training_enrollments FOR UPDATE
          USING (
            EXISTS (
              SELECT 1 FROM profiles
              WHERE profiles.id = auth.uid()
              AND profiles.role IN ('admin', 'super_admin')
            )
          );

        -- Allow admins to delete enrollments
        CREATE POLICY "Admins can delete enrollments"
          ON training_enrollments FOR DELETE
          USING (
            EXISTS (
              SELECT 1 FROM profiles
              WHERE profiles.id = auth.uid()
              AND profiles.role IN ('admin', 'super_admin')
            )
          );
      `;

      const { error } = await supabase.rpc('exec_sql', {
        sql: fixPoliciesSQL,
      });

      if (error) {
        logger.error('Policy fix error:', error);
        await writeApiAuditEvent({ ...auditBase, result: 'error', status_code: 500, error_summary: error.message?.slice(0, 200) });
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }

      await logAdminAudit({ action: AdminAction.ENROLLMENT_POLICIES_FIXED, actorId: ctx?.user?.id, entityType: 'rls_policies', entityId: BULK_ENTITY_ID, metadata: {}, req });
      await writeApiAuditEvent({ ...auditBase, result: 'success', status_code: 200 });
      return NextResponse.json({
        success: true,
        message: 'Enrollment policies updated: Admins can now enroll users directly',
      });
    } catch (err: any) {
      logger.error('Fix enrollment policies error:', err);
      await writeApiAuditEvent({ ...auditBase, result: 'error', status_code: 500, error_summary: err?.message?.slice(0, 200) });
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  },
  { roles: ['admin', 'super_admin'] }
);
