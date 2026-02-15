import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/client';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Webhook processing error' },
      { status: 400 }
    );
  }

  // Idempotency check
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  if (supabase) {
    const { data: existing } = await supabase
      .from('stripe_webhook_events')
      .select('id')
      .eq('stripe_event_id', event.id)
      .single();

    if (existing) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    await supabase
      .from('stripe_webhook_events')
      .insert({ stripe_event_id: event.id, event_type: event.type, status: 'processing' })
      .catch(() => {});
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;

    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent;
      break;

    default:
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get customer details
    const customerEmail = session.customer_details?.email || session.customer_email;
    const customerName = session.customer_details?.name || 'Customer';
    const courseId = session.metadata?.courseId;
    const courseName = session.metadata?.courseName;

    if (!customerEmail) {
      return;
    }

    // Check if customer already has an access key
    const { data: existingKey } = await supabase
      .from('training_access_keys')
      .select('*')
      .eq('email', customerEmail.toLowerCase())
      .eq('is_active', true)
      .single();

    let accessKey: string;

    if (existingKey) {
      // Use existing key
      accessKey = existingKey.access_key;
    } else {
      // Generate new access key
      const { data: newKey, error: keyError } = await supabase
        .rpc('create_employee_access_key', {
          p_email: customerEmail.toLowerCase(),
          p_employee_name: customerName,
          p_expires_days: 365 // 1 year access
        });

      if (keyError) {
        return;
      }

      accessKey = newKey;
    }

    // Record the purchase
    await supabase
      .from('training_purchases')
      .insert({
        email: customerEmail.toLowerCase(),
        customer_name: customerName,
        course_id: courseId,
        course_name: courseName,
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent as string,
        amount_paid: session.amount_total ? session.amount_total / 100 : 0,
        access_key: accessKey,
        purchased_at: new Date().toISOString()
      });

    // Send confirmation email with access key
    await sendPurchaseConfirmationEmail(
      customerEmail,
      customerName,
      courseName || 'Training Course',
      accessKey,
      session.amount_total ? session.amount_total / 100 : 0
    );

  } catch (error) {
    logger.error("Unhandled error", error instanceof Error ? error : undefined);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function sendPurchaseConfirmationEmail(
  email: string,
  name: string,
  courseName: string,
  accessKey: string,
  amountPaid: number
) {
  try {
    await resend.emails.send({
      from: 'SupersonicFastCash <noreply@supersonicfastcash.com>',
      to: email,
      subject: '🎉 Payment Confirmed - Your Training Access Key',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #16a34a 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .access-key { background: white; border: 3px solid #16a34a; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0; border-radius: 8px; font-family: monospace; }
            .button { display: inline-block; background: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .receipt { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .receipt-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .receipt-row:last-child { border-bottom: none; font-weight: bold; font-size: 18px; }
            .steps { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .step { margin: 15px 0; padding-left: 30px; position: relative; }
            .step:before { content: "✓"; position: absolute; left: 0; color: #16a34a; font-weight: bold; font-size: 20px; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Thank You for Your Purchase!</h1>
              <p>Your payment has been confirmed</p>
            </div>

            <div class="content">
              <h2>Hi ${name},</h2>
              <p>Thank you for purchasing <strong>${courseName}</strong>! Your payment has been processed successfully.</p>

              <div class="receipt">
                <h3>Receipt</h3>
                <div class="receipt-row">
                  <span>Course:</span>
                  <span>${courseName}</span>
                </div>
                <div class="receipt-row">
                  <span>Amount Paid:</span>
                  <span>$${amountPaid.toFixed(2)}</span>
                </div>
              </div>

              <h2>Your Training Access Key</h2>
              <p>Use this key to access your course:</p>

              <div class="access-key">${accessKey}</div>

              <p style="text-align: center; color: #666; font-size: 14px;">
                Keep this key safe! You'll need it to access your training.
              </p>

              <div class="steps">
                <h3>How to Access Your Course:</h3>
                <div class="step">Go to the training page</div>
                <div class="step">Click "Enter Access Key"</div>
                <div class="step">Enter your email and access key</div>
                <div class="step">Start learning immediately!</div>
              </div>

              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'}/supersonic-fast-cash/careers/training" class="button">
                  Start Learning Now →
                </a>
              </div>

              <h3>What's Included:</h3>
              <ul>
                <li>✓ Lifetime access to course materials</li>
                <li>✓ Video lessons and downloadable resources</li>
                <li>✓ Certificate of completion</li>
                <li>✓ Email support</li>
              </ul>

              <p>Questions? Reply to this email or contact us at supersonicfastcashllc@gmail.com</p>

              <p>Happy learning!</p>
            </div>

            <div class="footer">
              <p>SupersonicFastCash Tax Services</p>
              <p>This access key provides lifetime access to your purchased course.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

  } catch (error) {
    logger.error("Unhandled error", error instanceof Error ? error : undefined);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
