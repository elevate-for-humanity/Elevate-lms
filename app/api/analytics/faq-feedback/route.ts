import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(req: Request) {
  try {
    const supabase = await createClient();
    const _admin = createAdminClient(); const db = _admin || supabase;
    const { faq_id, helpful } = await req.json();

    await db.from('faq_search_analytics').insert({
      search_query: faq_id,
      searched_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // Fire-and-forget analytics
  }
}
export const POST = withApiAudit('/api/analytics/faq-feedback', _POST);
