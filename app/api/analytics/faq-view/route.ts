// PUBLIC ROUTE: anonymous FAQ view tracking
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(req: Request) {
  try {
    const supabase = await createClient();
      const { faq_id } = await req.json();

    await supabase.from('page_views').insert({
      page: `/faq/${faq_id}`,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
export const POST = withApiAudit('/api/analytics/faq-view', _POST);
