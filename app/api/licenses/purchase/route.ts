import { logger } from '@/lib/logger';
import { getStripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { program_id, license_type, lms_model } = body;

    if (!program_id || !license_type || !lms_model) {
      return NextResponse.json(
        { error: 'program_id, license_type, and lms_model are required' },
        { status: 400 }
      );
    }

    // Define pricing
    const pricing: Record<string, number> = {
      external: 0, // Free
      internal: 9900, // $99
      scorm_only: 14900, // $149
      hybrid: 19900, // $199
      unlimited: 49900, // $499
    };

    const amount = pricing[lms_model] || 0;

    // Get program details
    const { data: program } = await supabase
      .from('programs')
      .select('title')
      .eq('id', program_id)
      .single();

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    // If free license, create directly
    if (amount === 0) {
      const licenseKey = `FREE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const { data: license, error: licenseError } = await supabase
        .from('program_licenses')
        .insert({
          program_id,
          license_holder_id: user.id,
          license_key: licenseKey,
          license_type,
          lms_model,
          can_create_courses: false,
          can_upload_scorm: false,
          max_enrollments: 10,
          status: 'active',
        })
        .select()
        .single();

      if (licenseError) {
        return NextResponse.json(
          { error: 'Operation failed' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        license,
        message: 'Free license created successfully',
      });
    }

    // Create Stripe payment intent
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment processing not configured' },
        { status: 503 }
      );
    }
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        user_id: user.id,
        program_id,
        license_type,
        lms_model,
      },
      description: `${program.title} - ${lms_model} license`,
    });

    // Create pending license
    const licenseKey = `PEND-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const { data: license, error: licenseError } = await supabase
      .from('program_licenses')
      .insert({
        program_id,
        license_holder_id: user.id,
        license_key: licenseKey,
        license_type,
        lms_model,
        can_create_courses: ['internal', 'hybrid', 'unlimited'].includes(
          lms_model
        ),
        can_upload_scorm: ['scorm_only', 'hybrid', 'unlimited'].includes(
          lms_model
        ),
        max_enrollments:
          lms_model === 'unlimited' ? null : lms_model === 'hybrid' ? 100 : 50,
        status: 'pending',
        metadata: {
          stripe_payment_intent_id: paymentIntent.id,
        },
      })
      .select()
      .single();

    if (licenseError) {
      return NextResponse.json(
        { error: 'Operation failed' },
        { status: 500 }
      );
    }

    // Create payment record
    await supabase.from('payment_records').insert({
      user_id: user.id,
      amount: amount / 100,
      currency: 'usd',
      status: 'pending',
      stripe_payment_intent_id: paymentIntent.id,
      description: `License purchase: ${program.title}`,
      metadata: {
        license_id: license.id,
        program_id,
        license_type,
        lms_model,
      },
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      license,
      message: 'Payment intent created',
    });
  } catch (error: any) {
    logger.error('License purchase error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's licenses
    const { data: licenses, error } = await supabase
      .from('program_licenses')
      .select(
        `
        *,
        programs (
          id,
          title,
          slug
        )
      `
      )
      .eq('license_holder_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, licenses });
  } catch (error) {
    logger.error('Get licenses error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
