// PUBLIC ROUTE: public career course checkout
import { logger } from '@/lib/logger';
import { getStripe } from '@/lib/stripe/client';
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';
async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const { courseIds, email, successUrl, cancelUrl, promoCode } = await req.json();

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json({ error: 'No courses selected' }, { status: 400 });
    }

    const stripe = getStripe();
    const supabase = await getAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }

    // Fetch courses with Stripe price IDs
    const { data: courses, error } = await supabase
      .from('career_courses')
      .select('id, title, price, stripe_price_id, slug')
      .in('id', courseIds);

    if (error || !courses || courses.length === 0) {
      return NextResponse.json({ error: 'Courses not found' }, { status: 404 });
    }

    // Check if all courses have Stripe price IDs
    const missingStripe = courses.filter(c => !c.stripe_price_id);
    if (missingStripe.length > 0) {
      // Create Stripe products/prices on the fly
      for (const course of missingStripe) {
        const product = await stripe.products.create({
          name: course.course_name,
          metadata: {
            course_id: course.id,
            course_slug: course.slug,
            type: 'career_course',
          },
        });

        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(course.price * 100),
          currency: 'usd',
        });

        // Update database
        await supabase
          .from('career_courses')
          .update({
            stripe_product_id: product.id,
            stripe_price_id: price.id,
          })
          .eq('id', course.id);

        course.stripe_price_id = price.id;
      }
    }

    // Create line items
    const lineItems = courses.map(course => ({
      price: course.stripe_price_id,
      quantity: 1,
    }));

    // Handle promo code - create Stripe coupon if needed
    let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
    
    if (promoCode) {
      const { data: promo } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (promo) {
        // Create a Stripe coupon for this promo
        try {
          const coupon = await stripe.coupons.create({
            ...(promo.discount_type === 'percentage' 
              ? { percent_off: Number(promo.discount_value) }
              : { amount_off: Math.round(Number(promo.discount_value) * 100), currency: 'usd' }
            ),
            duration: 'once',
            name: promo.code,
            metadata: {
              promo_id: promo.id,
              promo_code: promo.code,
            },
          });
          
          discounts = [{ coupon: coupon.id }];

          // Increment usage count
          await supabase
            .from('promo_codes')
            .update({ current_uses: (promo.current_uses || 0) + 1 })
            .eq('id', promo.id);
        } catch (e) {
          logger.error('Failed to create Stripe coupon:', e);
        }
      }
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'klarna', 'afterpay_clearpay'],
      line_items: lineItems,
      discounts,
      success_url: successUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/career-services/courses/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/career-services/courses`,
      customer_email: email || undefined,
      metadata: {
        type: 'career_course',
        course_ids: courseIds.join(','),
        promo_code: promoCode || '',
      },
      allow_promotion_codes: !promoCode, // Only allow Stripe promos if no custom promo applied
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    logger.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/checkout/career-courses', _POST);
