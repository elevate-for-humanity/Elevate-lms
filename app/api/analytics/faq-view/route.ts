import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(req: Request) {
  try {
    const supabase = await createClient();
    const _admin = createAdminClient(); const db = _admin || supabase;
    const { faq_id } = await req.json();

    await db.from('page_views').insert({
      page: `/faq/${faq_id}`,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
export const POST = withApiAudit('/api/analytics/faq-view', _POST);
