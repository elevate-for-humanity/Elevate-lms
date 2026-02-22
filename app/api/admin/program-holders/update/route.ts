export const runtime = 'nodejs';
import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/auth';
import { withAuth } from '@/lib/with-auth';
import { toErrorMessage } from '@/lib/safe';

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

    const { error } = await db
      .from('program_holders')
      .update(updates)
      .eq('id', id);

    if (error) {
      return new Response(toErrorMessage(error), { status: 500 });
    }

    return Response.json({ ok: true });
  },
  { roles: ['admin', 'super_admin'] }
);
