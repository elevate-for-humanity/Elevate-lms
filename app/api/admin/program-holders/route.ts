export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/auth';
import { withAuth } from '@/lib/with-auth';
import { toError, toErrorMessage } from '@/lib/safe';

export const GET = withAuth(
  async (req, context) => {
    const { user } = context;
    const supabase = await createRouteHandlerClient({ cookies });

    const { data: holders, error } = await supabase
      .from('program_holders')
      .select(
        `
        id,
        name,
        owner_user_id,
        status,
        payout_share,
        mou_status,
        mou_signed_at,
        mou_holder_signed_at,
        mou_final_pdf_url,
        created_at,
        owner:owner_user_id(email),
        application:program_holder_applications(
          contact_name,
          contact_email,
          phone,
          training_focus,
          funding_sources
        )
      `
      )
      .order('created_at', { ascending: false });

    if (error) return new Response(toErrorMessage(error), { status: 500 });

    const mapped = (holders || []).map((h: Record<string, any>) => ({
      id: h.id,
      name: h.name,
      owner_email: h.owner?.email || 'Unknown',
      status: h.status,
      payout_share: h.payout_share,
      mou_status: h.mou_status,
      mou_signed_at: h.mou_signed_at,
      mou_holder_signed_at: h.mou_holder_signed_at,
      mou_final_pdf_url: h.mou_final_pdf_url,
      created_at: h.created_at,
      contact_name: h.application?.[0]?.contact_name || null,
      contact_email: h.application?.[0]?.contact_email || null,
      phone: h.application?.[0]?.phone || null,
      training_focus: h.application?.[0]?.training_focus || null,
      funding_sources: h.application?.[0]?.funding_sources || null,
    }));

    return Response.json(mapped);
  },
  { roles: ['admin', 'super_admin'] }
);
