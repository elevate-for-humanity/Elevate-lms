export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/auth';
import { withAuth } from '@/lib/with-auth';
import { toErrorMessage } from '@/lib/safe';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';

export const POST = withAuth(
  async (req, context) => {
    const { user } = context;
    const supabase = await createRouteHandlerClient({ cookies });
    const { id, status, mou_status } = await req.json();

    if (!id) {
      return new Response('Missing id', { status: 400 });
    }

    const updates: any = {};

    if (status) {
      updates.status = status;
    }

    if (mou_status) {
      updates.mou_status = mou_status;
      if (mou_status === 'signed') {
        updates.mou_signed_at = new Date().toISOString();
      }
    }

    const { error } = await supabase
      .from('program_holders')
      .update(updates)
      .eq('id', id);

    if (error) {
      return new Response(toErrorMessage(error), { status: 500 });
    }

    await logAdminAudit({
      action: AdminAction.PROGRAM_HOLDER_UPDATED,
      actorId: user.id,
      entityType: 'program_holders',
      entityId: id,
      metadata: { fields_updated: Object.keys(updates) },
      req,
    });

    return Response.json({ ok: true });
  },
  { roles: ['admin', 'super_admin'] }
);
