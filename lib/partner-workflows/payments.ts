
/**
 * Partner LMS Payment Integration
 * Handles Stripe payments for paid certifications
 */

import { getStripe, stripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/client';


export interface PaymentRequest {
  studentId: string;
  providerId: string;
  programId?: string;
  amount: number;
  currency?: string;
  successUrl: string;
  cancelUrl: string;
}

export interface PaymentResult {
  success: boolean;
  checkoutUrl?: string;
  sessionId?: string;
  error?: string;
}

/**
 * Create Stripe checkout session for partner certification payment
 */
export async function createPartnerPaymentSession(
  request: PaymentRequest
): Promise<PaymentResult> {
  try {
    const supabase = createClient();

    // Fetch provider details
    const { data: provider } = await supabase
      .from('partner_lms_providers')
      .select('*')
      .eq('id', request.providerId)
      .single();

    if (!provider) {
      throw new Error('Provider not found');
    }

    // Fetch student details
    const { data: student } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', request.studentId)
      .single();

    if (!student) {
      throw new Error('Student not found');
    }

    // Create pending enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('partner_lms_enrollments')
      .insert({
        provider_id: request.providerId,
        student_id: request.studentId,
        program_id: request.programId,
        status: 'payment_pending',
        enrolled_at: new Date().toISOString(),
        metadata: {
          payment_amount: request.amount,
          payment_currency: request.currency || 'usd',
        },
      })
      .select()
      .single();

    if (enrollmentError) {
      throw enrollmentError;
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: request.currency || 'usd',
            product_data: {
              name: `${provider.provider_name} Certification`,
              description: `Access to ${provider.provider_name} courses and certifications`,
              images: [
                'https://www.elevateforhumanity.org/images/certification-badge.png',
              ],
            },
            unit_amount: Math.round(request.amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.successUrl}?session_id={CHECKOUT_SESSION_ID}&enrollment_id=${enrollment.id}`,
      cancel_url: request.cancelUrl,
      customer_email: student.email,
      client_reference_id: enrollment.id,
      metadata: {
        enrollment_id: enrollment.id,
        provider_id: request.providerId,
        student_id: request.studentId,
        program_id: request.programId || '',
        type: 'partner_certification',
      },
    });

    // Update enrollment with session ID
    await supabase
      .from('partner_lms_enrollments')
      .update({
        payment_session_id: session.id,
      })
      .eq('id', enrollment.id);

    return {
      success: true,
      checkoutUrl: session.url || undefined,
      sessionId: session.id,
    };
  } catch (error) { /* Error handled silently */ 
    // Error: $1
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Handle successful payment webhook from Stripe
 */
export async function handlePaymentSuccess(sessionId: string): Promise<void> {
  const supabase = createClient();

  // Retrieve session from Stripe
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid') {
    throw new Error('Payment not completed');
  }

  const enrollmentId = session.metadata?.enrollment_id;
  if (!enrollmentId) {
    throw new Error('Enrollment ID not found in session metadata');
  }

  // Update enrollment status
  const { error: updateError } = await supabase
    .from('partner_lms_enrollments')
    .update({
      status: 'active',
      payment_status: 'paid',
      payment_completed_at: new Date().toISOString(),
      payment_amount: (session.amount_total || 0) / 100,
    })
    .eq('id', enrollmentId);

  if (updateError) {
    throw updateError;
  }

  // Send welcome email
  const { data: enrollment } = await supabase
    .from('partner_lms_enrollments')
    .select('provider_id, student_id')
    .eq('id', enrollmentId)
    .single();

  if (enrollment) {
    await supabase.functions.invoke('send-partner-welcome-email', {
      body: {
        enrollment_id: enrollmentId,
        provider_id: enrollment.provider_id,
        student_id: enrollment.student_id,
      },
    });
  }

  // Log payment
  await supabase.from('payment_logs').insert({
    enrollment_id: enrollmentId,
    stripe_session_id: sessionId,
    amount: (session.amount_total || 0) / 100,
    currency: session.currency || 'usd',
    status: 'completed',
    metadata: session.metadata,
  });
}

/**
 * Handle failed payment
 */
export async function handlePaymentFailure(sessionId: string): Promise<void> {
  const supabase = createClient();

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const enrollmentId = session.metadata?.enrollment_id;

  if (!enrollmentId) {
    return;
  }

  // Update enrollment status
  await supabase
    .from('partner_lms_enrollments')
    .update({
      status: 'payment_failed',
      payment_status: 'failed',
    })
    .eq('id', enrollmentId);

  // Log failed payment
  await supabase.from('payment_logs').insert({
    enrollment_id: enrollmentId,
    stripe_session_id: sessionId,
    amount: (session.amount_total || 0) / 100,
    currency: session.currency || 'usd',
    status: 'failed',
    metadata: session.metadata,
  });
}

/**
 * Get pricing for a provider
 */
export async function getProviderPricing(providerId: string): Promise<{
  amount: number;
  currency: string;
  requiresPayment: boolean;
}> {
  const supabase = createClient();

  const { data: provider } = await supabase
    .from('partner_lms_providers')
    .select('requires_payment, payment_amount')
    .eq('id', providerId)
    .single();

  if (!provider) {
    throw new Error('Provider not found');
  }

  return {
    amount: provider.payment_amount || 0,
    currency: 'usd',
    requiresPayment: provider.requires_payment || false,
  };
}

/**
 * Check if student has already paid for a provider
 */
export async function hasStudentPaid(
  studentId: string,
  providerId: string
): Promise<boolean> {
  const supabase = createClient();

  const { data: enrollments } = await supabase
    .from('partner_lms_enrollments')
    .select('payment_status')
    .eq('student_id', studentId)
    .eq('provider_id', providerId)
    .eq('payment_status', 'paid');

  return (enrollments?.length || 0) > 0;
}

/**
 * Create payment link for direct sharing
 */
export async function createPaymentLink(
  providerId: string,
  amount: number
): Promise<{ url: string; id: string }> {
  const supabase = createClient();

  const { data: provider } = await supabase
    .from('partner_lms_providers')
    .select('provider_name')
    .eq('id', providerId)
    .single();

  if (!provider) {
    throw new Error('Provider not found');
  }

  const paymentLink = await stripe.paymentLinks.create({
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${provider.provider_name} Certification`,
            description: `Access to ${provider.provider_name} courses and certifications`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      provider_id: providerId,
      type: 'partner_certification',
    },
  });

  return {
    url: paymentLink.url,
    id: paymentLink.id,
  };
}
