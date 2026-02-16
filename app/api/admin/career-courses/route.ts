import { getStripe } from '@/lib/stripe/client';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

async function guardAdmin() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

// GET - Fetch all career courses with modules
export async function GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const supabase = createAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }

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
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ courses });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

// POST - Create Stripe products for career courses
export async function POST(req: Request) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { action } = await req.json();

    if (action === 'sync-stripe') {
      const supabase = createAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }

      // Get all courses without Stripe IDs
      const { data: courses, error } = await supabase
        .from('career_courses')
        .select('*')
        .is('stripe_product_id', null);

      if (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }

      // Import Stripe
      const Stripe = (await import('stripe')).default;
      const stripe = getStripe();

      const results = [];

      for (const course of courses || []) {
        try {
          // Create Stripe product
          const product = await stripe.products.create({
            name: course.course_name,
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
            course: course.course_name,
            product_id: product.id,
            price_id: price.id,
            status: 'success',
          });
        } catch (stripeError: any) {
          results.push({
            course: course.course_name,
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
