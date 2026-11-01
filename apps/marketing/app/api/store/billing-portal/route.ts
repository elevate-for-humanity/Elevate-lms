import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Both individual and organization buyers manage Store invoices in Store. */
export async function POST() {
  const sessionClient = await createClient();
  const {
    data: { user },
    error,
  } = await sessionClient.auth.getUser();
  if (error || !user?.id)
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  return NextResponse.json({
    url: 'https://store.elevateforhumanity.org/store/account/billing',
    provider: 'quickbooks',
  });
}
