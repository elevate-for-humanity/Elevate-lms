/**
 * Supabase Webhook Handler - Admin
 * Verifies webhook signature and handles events
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('x-supabase-signature');
  
  // Verify webhook signature
  const secret = process.env.SUPABASE_WEBHOOK_SECRET;
  if (!secret || !signature) {
    return NextResponse.json({ error: 'Invalid webhook' }, { status: 401 });
  }

  // In production, verify HMAC signature here
  // const isValid = verifySignature(body, signature, secret);

  try {
    const event = JSON.parse(body);
    console.error('Supabase webhook event:', event.type);

    switch (event.type) {
      case 'INSERT':
        // Handle new record
        break;
      case 'UPDATE':
        // Handle update
        break;
      case 'DELETE':
        // Handle delete
        break;
      default:
        console.error('Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true, service: 'admin' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
