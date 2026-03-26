

import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'payment');
    if (rateLimited) return rateLimited;

    const { apiRequireAdmin } = await import('@/lib/authGuards');
    const auth = await apiRequireAdmin();
    if (auth.error) return auth.error;

    const {
      studentId,
      programId,
      programSlug,
      fundingSource = 'WIOA',
    } = await req.json();

    if (!studentId || !programId || !programSlug) {
      return NextResponse.json(
        { error: 'Missing required fields: studentId, programId, programSlug' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get student profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, first_name, last_name')
      .eq('id', studentId)
      .single();

    if (profileError || !profile?.email) {
      logger.error('Student profile not found', {
        studentId,
        error: profileError,
      });
      return NextResponse.json(
        { error: 'Student profile/email not found' },
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

    // Determine price - use env var or program cost
    const amount = program.total_cost
      ? Math.round(Number(program.total_cost) * 100)
      : 29500; // Default $295 for Milady RISE

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Create Stripe checkout session (sponsor-paid)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email:
        process.env.SPONSOR_FINANCE_EMAIL ||
        'accounting@elevateforhumanity.org',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${fundingSource} - ${program.name}`,
              description: `Student: ${profile.full_name || profile.email} | Program: ${program.name}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/funding/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/funding/canceled`,
      metadata: {
        // Standardized metadata for grant/license compliance
        payment_type: 'funded_enrollment',
        funding_source: fundingSource,
        student_id: studentId,
        program_id: programId,
        program_slug: programSlug,
        sponsor: '2Exclusive LLC-S',
        student_email: profile.email,
        student_name:
          profile.full_name || `${profile.first_name} ${profile.last_name}`,
      },
    });

    // Store funding payment record for audit
    const { error: paymentError } = await supabase
      .from('funding_payments')
      .insert({
        student_id: studentId,
        program_id: programId,
        funding_source: fundingSource,
        stripe_checkout_session_id: session.id,
        status: 'created',
        amount: amount / 100,
        created_at: new Date().toISOString(),
      });

    if (paymentError) {
      logger.warn('Failed to create funding_payments record', paymentError);
      // Continue anyway - webhook will handle it
    }

    logger.info('Funding checkout session created', {
      sessionId: session.id,
      studentId,
      programId,
      fundingSource,
    });

    return NextResponse.json({
      ok: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (err: any) {
    logger.error('Funding checkout creation error', err);
    return NextResponse.json(
      { error: toErrorMessage(err) || 'Internal server error' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/funding/create-checkout', _POST);
