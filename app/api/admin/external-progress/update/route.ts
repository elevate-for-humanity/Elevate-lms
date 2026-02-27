export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/admin/external-progress/update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { withAuth } from '@/lib/with-auth';
import { logger } from '@/lib/logger';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
import { writeApiAuditEvent } from '@/lib/audit/api-audit';

export const POST = withAuth(
  async (req: NextRequest, ctx) => {
    const auditBase = { endpoint: '/api/admin/external-progress/update', method: 'POST', actor_type: 'user' as const, actor_id: ctx?.user?.id ?? null };
    type Status = 'approved' | 'in_progress';
    try {
      const body = await req.json();
      const { id, status } = body as { id: string; status: Status };

      if (!id || !status) {
        await writeApiAuditEvent({ ...auditBase, result: 'failure', status_code: 400, error_summary: 'Missing id or status' });
        return NextResponse.json(
          { error: 'id and status are required' },
          { status: 400 }
        );
      }

      if (status !== 'approved' && status !== 'in_progress') {
        await writeApiAuditEvent({ ...auditBase, result: 'failure', status_code: 400, params: { id, status }, error_summary: 'Invalid status' });
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }

      // Build update object based on status
      if (status === 'approved') {
        const { error } = await (supabaseAdmin as any)
          .from('external_partner_progress')
          .update({
            status,
            approved_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (error) {
          logger.error('Error updating external progress', error);
          await writeApiAuditEvent({ ...auditBase, result: 'error', status_code: 500, params: { id, status }, error_summary: error.message?.slice(0, 200) });
          return NextResponse.json(
            { error: 'Failed to update status' },
            { status: 500 }
          );
        }
      } else {
        // status === "in_progress"
        const { error } = await (supabaseAdmin as any)
          .from('external_partner_progress')
          .update({
            status,
            proof_file_url: null,
            approved_at: null,
            approved_by: null,
          })
          .eq('id', id);

        if (error) {
          logger.error('Error updating external progress', error);
          await writeApiAuditEvent({ ...auditBase, result: 'error', status_code: 500, params: { id, status }, error_summary: error.message?.slice(0, 200) });
          return NextResponse.json(
            { error: 'Failed to update status' },
            { status: 500 }
          );
        }
      }

      await logAdminAudit({ action: AdminAction.EXTERNAL_PROGRESS_UPDATED, actorId: ctx?.user?.id, entityType: 'external_partner_progress', entityId: id, metadata: { status }, req });
      await writeApiAuditEvent({ ...auditBase, result: 'success', status_code: 200, params: { id, status } });
      return NextResponse.json({ success: true });
    } catch (err: any) {
      logger.error(err);
      await writeApiAuditEvent({ ...auditBase, result: 'error', status_code: 500, error_summary: err?.message?.slice(0, 200) });
      return NextResponse.json(
        { error: 'Unexpected error' },
        { status: 500 }
      );
    }
  },
  { roles: ['admin', 'super_admin'] }
);
