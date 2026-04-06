import { getStripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { APP_STORE_PRODUCTS } from '@/lib/stripe/app-store-products';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Use env var with fallback to canonical domain
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

/**
 * CANONICAL LEARNER CHECKOUT
 * 
 * Single entry point for all individual learner payments:
 * - Student subscription ($39/mo)
 * - Career track subscription ($149/mo)
 * - Program enrollment (one-time)
 * - Course purchase (one-time)
 * 
 * All other checkout handlers should redirect here.
 */

type CheckoutType = 'subscription' | 'program' | 'course';
type SubscriptionTier = 'student' | 'career';

interface CheckoutRequest {
  type: CheckoutType;
  tier?: SubscriptionTier;
  programId?: string;
  courseId?: string;
  priceId?: string;
  amount?: number; // in cents, for dynamic pricing
}

async function _POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Payment system not configured' },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const body: CheckoutRequest = await request.json();
    const { type, tier, programId, courseId, priceId } = body;

    let sessionConfig: Stripe.Checkout.SessionCreateParams;

    switch (type) {
      case 'subscription': {
        // Subscription checkout (student or career tier)
        const tierConfig = tier === 'career' 
          ? { priceEnv: 'STRIPE_PRICE_CAREER', product: APP_STORE_PRODUCTS.find(p => p.tier === 'career') }
          : { priceEnv: 'STRIPE_PRICE_STUDENT', product: APP_STORE_PRODUCTS.find(p => p.tier === 'student') };

        const stripePriceId = process.env[tierConfig.priceEnv] || tierConfig.product?.stripePriceId;

        if (!stripePriceId) {
          return NextResponse.json(
            { error: `${tier || 'student'} pricing not configured` },
            { status: 500 }
          );
        }

        sessionConfig = {
          mode: 'subscription',
          line_items: [{ price: stripePriceId, quantity: 1 }],
          success_url: `${SITE_URL}/onboarding/learner?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${SITE_URL}/pricing?checkout=cancelled`,
          customer_email: user.email || undefined,
          subscription_data: {
            metadata: {
              user_id: user.id,
              checkout_type: 'learner_subscription',
              tier: tier || 'student',
            },
          },
          metadata: {
            user_id: user.id,
            checkout_type: 'learner_subscription',
            tier: tier || 'student',
          },
        };
        break;
      }

      case 'program': {
        // Program enrollment (one-time payment)
        if (!programId) {
          return NextResponse.json(
            { error: 'Program ID required' },
            { status: 400 }
          );
        }

        // Get program details
        const { data: program } = await supabase
          .from('programs')
          .select('id, name, slug, total_cost')
          .eq('id', programId)
          .single();

        if (!program) {
          return NextResponse.json(
            { error: 'Program not found' },
            { status: 404 }
          );
        }

        // Price must come from DB — never trust client-supplied amount
        const programAmount = program.total_cost ? Math.round(Number(program.total_cost) * 100) : 0;

        if (programAmount <= 0) {
          return NextResponse.json(
            { error: 'Invalid program price' },
            { status: 400 }
          );
        }

        sessionConfig = {
          mode: 'payment',
          line_items: [{
            price_data: {
              currency: 'usd',
              product_data: {
                name: program.name,
                description: `Enrollment in ${program.name}`,
              },
              unit_amount: programAmount,
            },
            quantity: 1,
          }],
          success_url: `${SITE_URL}/onboarding/learner?checkout=success&program=${program.slug}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${SITE_URL}/programs/${program.slug}?checkout=cancelled`,
          customer_email: user.email || undefined,
          metadata: {
            kind: 'program_enrollment',
            user_id: user.id,
            student_id: user.id,
            program_id: programId,
            program_slug: program.slug,
          },
        };
        break;
      }

      case 'course': {
        // Course purchase (one-time payment)
        if (!courseId) {
          return NextResponse.json(
            { error: 'Course ID required' },
            { status: 400 }
          );
        }

        const { data: course } = await supabase
          .from('training_courses')
          .select('id, title, slug, price')
          .eq('id', courseId)
          .single();

        if (!course) {
          return NextResponse.json(
            { error: 'Course not found' },
            { status: 404 }
          );
        }

        // Price must come from DB — never trust client-supplied amount
        const courseAmount = course.price ? Math.round(Number(course.price) * 100) : 0;

        if (courseAmount <= 0) {
          return NextResponse.json(
            { error: 'Invalid course price' },
            { status: 400 }
          );
        }

        sessionConfig = {
          mode: 'payment',
          line_items: [{
            price_data: {
              currency: 'usd',
              product_data: {
                name: course.title,
                description: `Access to ${course.title}`,
              },
              unit_amount: courseAmount,
            },
            quantity: 1,
          }],
          success_url: `${SITE_URL}/courses/${course.slug}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${SITE_URL}/courses/${course.slug}?checkout=cancelled`,
          customer_email: user.email || undefined,
          metadata: {
            kind: 'course_purchase',
            user_id: user.id,
            student_id: user.id,
            course_id: courseId,
            course_slug: course.slug,
          },
        };
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid checkout type. Use: subscription, program, or course' },
          { status: 400 }
        );
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create(sessionConfig);

    logger.info('Learner checkout session created', {
      sessionId: session.id,
      type,
      userId: user.id,
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    logger.error('Learner checkout error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/checkout/learner', _POST);
