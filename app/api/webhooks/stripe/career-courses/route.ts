import { logger } from '@/lib/logger';
import { getStripe } from '@/lib/stripe/client';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';
function getWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET_CAREER_COURSES || process.env.STRIPE_WEBHOOK_SECRET || '';
}

async function _POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  const stripe = getStripe();
  const webhookSecret = getWebhookSecret();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    logger.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      // Check if this is a career course purchase
      if (session.metadata?.type !== 'career_course') {
        return NextResponse.json({ received: true, skipped: true });
      }

      const courseIds = session.metadata.course_ids?.split(',') || [];
      const customerEmail = session.customer_email || session.customer_details?.email;

      // Get user by email
      let userId: string | null = null;
      if (customerEmail) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', customerEmail)
          .single();
        
        userId = profile?.id || null;
      }

      // Record purchases for each course
      for (const courseId of courseIds) {
        const { error } = await supabase
          .from('career_course_purchases')
          .upsert({
            user_id: userId,
            course_id: courseId,
            email: customerEmail || '',
            amount_paid: (session.amount_total || 0) / 100 / courseIds.length,
            stripe_payment_id: session.payment_intent as string,
            stripe_session_id: session.id,
            status: 'completed',
            purchased_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,course_id',
          });

        if (error) {
          logger.error('Error recording purchase:', error);
        }
      }

      // Send confirmation email
      if (customerEmail) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: customerEmail,
              subject: 'Your Career Course Purchase - Elevate for Humanity',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #7c3aed;">Thank You for Your Purchase!</h2>
                  <p>Your career course purchase has been confirmed.</p>
                  <p><strong>Order ID:</strong> ${session.id}</p>
                  <p><strong>Amount:</strong> $${((session.amount_total || 0) / 100).toFixed(2)}</p>
                  
                  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Start Learning Now</h3>
                    <p>Access your courses and begin your career transformation.</p>
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/career-services/courses/my-courses" 
                       style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                      Go to My Courses
                    </a>
                  </div>
                  
                  <p>Questions? Reply to this email or call (317) 314-3757.</p>
                  <p>Best regards,<br><strong>Elevate for Humanity Team</strong></p>
                </div>
              `,
            }),
          });
        } catch (emailError) {
          logger.error('Error sending confirmation email:', emailError);
        }
      }

      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      logger.info('Payment failed:', paymentIntent.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
export const POST = withApiAudit('/api/webhooks/stripe/career-courses', _POST, { actor_type: 'webhook', skip_body: true });
