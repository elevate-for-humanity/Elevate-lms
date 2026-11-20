import { NextResponse } from 'next/server';
import { listApprenticeInvoices } from '@/lib/billing/apprentice-invoice-batch';
import { logger } from '@/lib/logger';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const headers = { 'Cache-Control': 'private, no-store' };
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });

    const db = await requireAdminClient();
    const invoices = await listApprenticeInvoices(db, user.id, 10, user.email_confirmed_at ? user.email ?? null : null);
    return NextResponse.json({ invoices }, { headers });
  } catch (error) {
    logger.error('Could not load account invoices', error);
    return NextResponse.json({ error: 'Could not load invoices' }, { status: 503, headers });
  }
}
