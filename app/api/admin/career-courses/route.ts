import { getStripe } from '@/lib/stripe/client';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// GET - Fetch all career courses with modules
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: courses, error } = await supabase
      .from('career_courses')
      .select(`
        *,
        modules:career_course_modules(*)
      `)
      .eq('is_active', true)
      .eq('is_bundle', false)
      .order('title');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ courses });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

// POST - Create Stripe products for career courses
export async function POST(req: Request) {
  try {
    const { action } = await req.json();

    if (action === 'sync-stripe') {
      const supabase = createAdminClient();

      // Get all courses without Stripe IDs
      const { data: courses, error } = await supabase
        .from('career_courses')
        .select('*')
        .is('stripe_product_id', null);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Import Stripe
      const Stripe = (await import('stripe')).default;
      const stripe = getStripe();

      const results = [];

      for (const course of courses || []) {
        try {
          // Create Stripe product
          const product = await stripe.products.create({
            name: course.title,
            description: course.description || undefined,
            metadata: {
              course_id: course.id,
              course_slug: course.slug,
              type: 'career_course',
            },
          });

          // Create Stripe price
          const price = await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(course.price * 100),
            currency: 'usd',
            metadata: {
              course_id: course.id,
            },
          });

          // Update course with Stripe IDs
          await supabase
            .from('career_courses')
            .update({
              stripe_product_id: product.id,
              stripe_price_id: price.id,
            })
            .eq('id', course.id);

          results.push({
            course: course.title,
            product_id: product.id,
            price_id: price.id,
            status: 'success',
          });
        } catch (stripeError: any) {
          results.push({
            course: course.title,
            status: 'error',
            error: stripeError.message,
          });
        }
      }

      return NextResponse.json({ results });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
