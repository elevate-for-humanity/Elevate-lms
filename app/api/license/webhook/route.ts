import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  console.log('[webhook] Request received');
  
  let body: string;
  let signature: string | null;
  
  try {
    body = await request.text();
    signature = request.headers.get('stripe-signature');
    console.log('[webhook] Body length:', body.length, 'Signature:', signature ? 'present' : 'missing');
  } catch (e) {
    console.error('[webhook] Failed to read request:', e);
    return NextResponse.json({ error: 'Failed to read request' }, { status: 400 });
  }

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log('[webhook] Event verified:', event.type, event.id);
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log('[webhook] Processing checkout session:', session.id);
    console.log('[webhook] Metadata:', JSON.stringify(session.metadata));
    
    const licenseId = session.metadata?.license_id;
    const tenantId = session.metadata?.tenant_id;
    const customerId = session.customer as string | null;
    
    console.log('[webhook] License ID:', licenseId, 'Customer ID:', customerId);
    
    if (licenseId) {
      try {
        const supabase = createAdminClient();
        if (!supabase) {
          console.error('[webhook] Supabase client not available');
          return NextResponse.json({ received: true, warning: 'db_unavailable' });
        }
        
        const updateData: Record<string, any> = {
          status: 'active',
          updated_at: new Date().toISOString(),
        };
        if (customerId) updateData.stripe_customer_id = customerId;
        
        console.log('[webhook] Updating license with:', JSON.stringify(updateData));
        
        const { data, error } = await supabase
          .from('licenses')
          .update(updateData)
          .eq('id', licenseId)
          .select('id, stripe_customer_id, updated_at');
        
        if (error) {
          console.error('[webhook] DB update error:', error);
        } else {
          console.log('[webhook] License updated:', JSON.stringify(data));
        }
      } catch (dbErr) {
        console.error('[webhook] DB operation failed:', dbErr);
      }
    }
  }

  return NextResponse.json({ received: true });
}
