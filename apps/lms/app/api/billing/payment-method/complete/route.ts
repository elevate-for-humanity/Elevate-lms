import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Legacy setup callbacks cannot save a payment method. Current invoice and
// PayPal agreement status is shown on the authenticated billing page.
export async function GET(request: NextRequest) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  const destination = user
    ? '/account/payment-methods'
    : '/login?redirect=/account/payment-methods';
  return NextResponse.redirect(new URL(destination, request.url));
}
