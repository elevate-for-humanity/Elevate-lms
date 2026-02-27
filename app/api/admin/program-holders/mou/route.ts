
import { createAdminClient } from '@/lib/supabase/admin';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/auth';
import { generateMOUText } from '@/lib/mou-template';
import { withAuth } from '@/lib/with-auth';

import { auditMutation } from '@/lib/api/withAudit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

const _GET = withAuth(
  async (req, context) => {
    const { user } = context;
    const supabase = await createRouteHandlerClient({ cookies });
      const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response('Missing program holder id', { status: 400 });
    }

    // Get program holder details
    const { data: holder, error } = await supabase
      .from('program_holders')
      .select(
        `
        id,
        name,
        payout_share,
        mou_status,
        application:program_holder_applications(
          contact_name,
          contact_email
        )
      `
      )
      .eq('id', id)
      .single();

    if (error || !holder) {
      return new Response('Program holder not found', { status: 404 });
    }

    // Generate MOU text
    const mouText = generateMOUText({
      programHolderName: holder.name,
      payoutShare: holder.payout_share || 0.333,
      contactName: holder.application?.[0]?.contact_name,
      contactEmail: holder.application?.[0]?.contact_email,
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    });

    // Update MOU status to 'sent' if not already
    if (holder.mou_status === 'not_sent') {
      await supabase
        .from('program_holders')
        .update({ mou_status: 'sent' })
        .eq('id', id);

      await logAdminAudit({
        action: AdminAction.MOU_STATUS_CHANGED,
        actorId: user.id,
        entityType: 'program_holders',
        entityId: id,
        metadata: { new_status: 'sent' },
        req,
      });
    }

    // Return as downloadable text file
  const filename = `EFH_MOU_${holder.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;

  return new Response(mouText, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });

  },
  { roles: ['admin', 'super_admin'] }
);
export const GET = withApiAudit('/api/admin/program-holders/mou', _GET);
