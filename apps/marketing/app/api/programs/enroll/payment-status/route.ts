import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { verifyPaidApplication } from '@/lib/enrollment/paid-application';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to verify payment.' }, { status: 401 });
  const slug = request.nextUrl.searchParams.get('program') || '';
  if (!/^[a-z0-9-]{2,100}$/.test(slug)) return NextResponse.json({ error: 'Invalid program.' }, { status: 400 });
  try {
    const db = await requireAdminClient();
    // Only the signed-in learner's paid receipts. No arbitrary email lookup.
    const invoices = await db.from('billing_invoices').select('id')
      .eq('customer_external_key', `user:${user.id}`).eq('status', 'paid')
      .eq('fulfillment_payload->>program_slug', slug)
      .order('created_at', { ascending: false }).limit(10);
    if (invoices.error) throw invoices.error;
    for (const invoice of invoices.data || []) {
      if (await verifyPaidApplication(slug, invoice.id)) {
        const query = new URLSearchParams({ program: slug, intent: 'enrollment', billing_invoice_id: invoice.id });
        return NextResponse.json({ paid: true, application_url: `/apply/student/form?${query}` },
          { headers: { 'Cache-Control': 'private, no-store' } });
      }
    }
    return NextResponse.json({ paid: false }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'Payment verification is temporarily unavailable.' }, { status: 503 });
  }
}
