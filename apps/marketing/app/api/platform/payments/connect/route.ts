import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function retiredConnect(request: NextRequest) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  return NextResponse.json({
    error: 'Website-owned merchant onboarding is retired. Use the Elevate billing flow for approved offers and invoices.',
    billingUrl: 'https://app.elevateforhumanity.org/account/payment-methods',
  }, { status: 410 });
}

export const GET = retiredConnect;
export const POST = retiredConnect;
