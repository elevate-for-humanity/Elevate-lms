// PUBLIC ROUTE: anonymous FAQ feedback collection
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { applyRateLimit } from '@/lib/api/withRateLimit';

async function _POST(req: Request) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  try {
    const supabase = await createClient();
    const { faq_id, helpful } = await req.json();

    await supabase.from('faq_search_analytics').insert({
      search_query: faq_id,
      searched_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // Fire-and-forget analytics
  }
}
export const POST = withApiAudit('/api/analytics/faq-feedback', _POST);
