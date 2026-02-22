import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe/client';
import { CERTIPORT_EXAMS } from '@/lib/partners/certiport';
import { applyRateLimit } from '@/lib/api/withRateLimit';

/**
 * Certiport Exam Request
 *
 * Two paths based on student funding:
 *
 * FUNDED (WIOA/WRG/JRI/Employer):
 *   → Exam request created (status: pending)
 *   → Admin assigns voucher from Certiport portal
 *   → Student gets voucher for free
 *
 * SELF-PAY:
 *   → Stripe checkout session created (student pays Elevate)
 *   → After payment, exam request created (status: paid)
 *   → Admin assigns voucher from Certiport portal
 *   → Student gets voucher
 *
 * Either way, Elevate purchases the voucher from Certiport.
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { examCode, courseId, programSlug } = body;

    if (!examCode) {
      return NextResponse.json({ error: 'examCode is required' }, { status: 400 });
    }

    const exam = CERTIPORT_EXAMS[examCode as CertiportExamCode];
    if (!exam) {
      return NextResponse.json({ error: `Invalid exam code: ${examCode}` }, { status: 400 });
    }

    // Check for existing request
    const { data: existing } = await db
      .from('certiport_exam_requests')
      .select('id, status, voucher_code')
      .eq('user_id', user.id)
      .eq('exam_code', examCode)
      .in('status', ['pending', 'paid', 'voucher_assigned'])
      .single();

    if (existing) {
      return NextResponse.json({
        message: existing.status === 'voucher_assigned'
          ? 'Voucher already assigned. Check your dashboard.'
          : 'Exam request already submitted. Your voucher will be assigned soon.',
        requestId: existing.id,
        status: existing.status,
        voucherCode: existing.voucher_code || null,
      });
    }

    // Verify course completion if courseId provided
    if (courseId) {
      const { data: progress } = await db
        .from('lesson_progress')
        .select('completed')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .eq('completed', true);

      const { data: totalLessons } = await db
        .from('training_lessons')
        .select('id')
        .eq('course_id', courseId);

      const completedCount = progress?.length || 0;
      const totalCount = totalLessons?.length || 1;

      if (completedCount < totalCount) {
        return NextResponse.json(
          { error: 'Complete all course lessons before requesting the exam.' },
          { status: 403 }
        );
      }
    }

    // Get student profile
    const { data: profile } = await db
      .from('profiles')
      .select('full_name, email, phone')
      .eq('id', user.id)
      .single();

    // Determine funding status from enrollment
    let fundingSource = 'SELF_PAY';
    if (programSlug) {
      const { data: enrollment } = await db
        .from('program_enrollments')
        .select('funding_source')
        .eq('user_id', user.id)
        .eq('program_slug', programSlug)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (enrollment?.funding_source) {
        fundingSource = enrollment.funding_source;
      }
    }

    const isFunded = fundingSource !== 'SELF_PAY';
    const studentEmail = profile?.email || user.email || '';
    const studentName = profile?.full_name || '';

    if (isFunded) {
      // FUNDED PATH: Create request directly, no payment needed
      const { data: examRequest, error } = await db
        .from('certiport_exam_requests')
        .insert({
          user_id: user.id,
          exam_code: examCode,
          exam_name: exam.name,
          exam_category: exam.category,
          course_id: courseId || null,
          program_slug: programSlug || null,
          student_name: studentName,
          student_email: studentEmail,
          funding_source: fundingSource,
          status: 'pending',
        })
        .select('id')
        .single();

      if (error) {
        logger.error('Failed to create exam request:', error);
        return NextResponse.json({ error: 'Failed to submit exam request' }, { status: 500 });
      }

      return NextResponse.json({
        path: 'funded',
        message: 'Exam request submitted. Your voucher will be assigned within 1-2 business days.',
        requestId: examRequest.id,
        status: 'pending',
      });
    }

    // SELF-PAY PATH: Create Stripe checkout, student pays Elevate
    if (!stripe) {
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 503 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Certification Exam: ${exam.name}`,
              description: 'Certiport certification exam voucher. Proctored on-site at Elevate testing center.',
            },
            unit_amount: 15000, // $150.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${siteUrl}/certiport-exam/success?session_id={CHECKOUT_SESSION_ID}&exam=${examCode}`,
      cancel_url: `${siteUrl}/certiport-exam?cancelled=true`,
      customer_email: studentEmail,
      metadata: {
        kind: 'certiport_exam',
        exam_code: examCode,
        exam_name: exam.name,
        user_id: user.id,
        student_name: studentName,
        student_email: studentEmail,
        program_slug: programSlug || '',
        course_id: courseId || '',
        funding_source: 'SELF_PAY',
      },
    });

    return NextResponse.json({
      path: 'self_pay',
      message: 'Redirecting to payment.',
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    logger.error('Certiport exam request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
