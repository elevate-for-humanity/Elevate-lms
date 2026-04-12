import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/auth';
import { withAuth } from '@/lib/with-auth';
import { toErrorMessage } from '@/lib/safe';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

const _GET = withAuth(
  async (req, context) => {
    const { user } = context;
    const supabase = await createRouteHandlerClient({ cookies });

    const { data: holders, error } = await supabase
      .from('program_holders')
      .select(
        `
        id,
        name,
        organization_name,
        contact_name,
        contact_email,
        contact_phone,
        status,
        payout_share,
        mou_signed,
        mou_status,
        mou_holder_signed_at,
        mou_final_pdf_url,
        approved_at,
        created_at,
        user_id
      `
      )
      .order('created_at', { ascending: false });

    if (error) return new Response(toErrorMessage(error), { status: 500 });

    const mapped = (holders || []).map((h: Record<string, any>) => ({
      id: h.id,
      name: h.organization_name || h.name || 'Unnamed',
      status: h.status,
      payout_share: h.payout_share,
      mou_signed: h.mou_signed,
      mou_status: h.mou_status,
      mou_holder_signed_at: h.mou_holder_signed_at,
      mou_final_pdf_url: h.mou_final_pdf_url,
      approved_at: h.approved_at,
      created_at: h.created_at,
      contact_name: h.contact_name || null,
      contact_email: h.contact_email || null,
      contact_phone: h.contact_phone || null,
      user_id: h.user_id,
    }));

    return Response.json(mapped);
  },
  { roles: ['admin', 'super_admin'] }
);
export const GET = withApiAudit('/api/admin/program-holders', _GET);
