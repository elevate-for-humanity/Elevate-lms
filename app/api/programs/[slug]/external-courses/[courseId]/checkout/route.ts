import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { safeError, safeDbError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getStripe } from '@/lib/stripe/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; courseId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'payment');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(request);

  const stripe = getStripe();
  if (!stripe) return safeError('Payment system not configured', 503);

  const { slug, courseId } = await params;
  const db = await createClient();
  const adminDb = createAdminClient();

  // Resolve slug → program
  const { data: program, error: progErr } = await db
    .from('programs')
    .select('id, title, slug')
    .eq('slug', slug)
    .maybeSingle();

  if (progErr) return safeDbError(progErr, 'Program lookup failed');
  if (!program) return safeError('Program not found', 404);

  // Load the external course
  const { data: course, error: courseErr } = await adminDb
    .from('program_external_courses')
    .select('id, title, partner_name, cost_cents, stripe_price_id, payer_rule, manual_completion_enabled')
    .eq('id', courseId)
    .eq('program_id', program.id)
    .eq('is_active', true)
    .maybeSingle();

  if (courseErr) return safeDbError(courseErr, 'Course lookup failed');
  if (!course) return safeError('External course not found', 404);

  // Load student's enrollment to determine funding source
  const { data: enrollment } = await adminDb
    .from('student_enrollments')
    .select('id, funding_source')
    .eq('student_id', auth.id)
    .eq('program_id', program.id)
    .in('status', ['active', 'pending'])
    .maybeSingle();

  const fundingSource = enrollment?.funding_source ?? 'self_pay';

  // Elevate covers external course costs only for WIOA and Indiana workforce
  // grant funding sources. DOL apprenticeship, employer-sponsored, scholarship,
  // pell, and self-pay are the student's responsibility unless payer_rule
  // overrides explicitly.
  const ELEVATE_SPONSORED_SOURCES = new Set([
    'wioa',
    'wioa_title_i',
    'wioa_title_ii',
    'workone',
    'workforce_ready_grant',
    'jri',
    'job_ready_indy',
  ]);
  const isElevateSponsored = ELEVATE_SPONSORED_SOURCES.has(fundingSource);

  // Determine who pays based on payer_rule + funding_source
  let studentPays: boolean;
  switch (course.payer_rule) {
    case 'always_student':
      studentPays = true;
      break;
    case 'always_elevate':
      studentPays = false;
      break;
    case 'sponsored':
    default:
      studentPays = !isElevateSponsored;
  }

  // If Elevate pays, record a $0 internal purchase and return — no Stripe session needed.
  // Staff will purchase on the partner site and enter login credentials in admin.
  if (!studentPays) {
    const { error: upsertErr } = await adminDb
      .from('external_course_completions')
      .upsert(
        {
          user_id: auth.id,
          external_course_id: courseId,
          program_id: program.id,
          completed_at: null,           // not complete yet — just purchased
          elevate_sponsored: true,
        },
        { onConflict: 'user_id,external_course_id' },
      );

    if (upsertErr) return safeDbError(upsertErr, 'Failed to record sponsored enrollment');

    return NextResponse.json({
      ok: true,
      payer: 'elevate',
      message: 'Elevate will purchase this course on your behalf. Login credentials will be emailed to you shortly.',
    });
  }

  // Student pays — create Stripe Checkout session
  const { data: profile } = await db
    .from('profiles')
    .select('email, full_name')
    .eq('id', auth.id)
    .maybeSingle();

  const customerEmail = profile?.email ?? auth.email ?? '';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';

  // Use pre-created Stripe price if available, otherwise build ad-hoc
  const lineItems = course.stripe_price_id
    ? [{ price: course.stripe_price_id, quantity: 1 }]
    : [
        {
          price_data: {
            currency: 'usd',
            unit_amount: course.cost_cents,
            product_data: {
              name: `${course.title} — ${course.partner_name}`,
              description: `Required external training for ${program.title}`,
            },
          },
          quantity: 1,
        },
      ];

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: customerEmail,
      line_items: lineItems,
      success_url: `${siteUrl}/lms/courses/${program.slug}?ext_paid=1`,
      cancel_url: `${siteUrl}/lms/courses/${program.slug}`,
      metadata: {
        kind: 'external_course_purchase',
        program_id: program.id,
        program_slug: program.slug,
        external_course_id: courseId,
        student_id: auth.id,
        student_email: customerEmail,
        partner_name: course.partner_name,
        course_title: course.title,
        funding_source: fundingSource,
      },
    });

    return NextResponse.json({ ok: true, payer: 'student', url: session.url });
  } catch (err) {
    return safeInternalError(err, 'Failed to create checkout session');
  }
}
