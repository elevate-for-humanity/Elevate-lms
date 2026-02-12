export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { parseBody, getErrorMessage } from '@/lib/api-helpers';
import { stripe } from '@/lib/stripe/client';

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 503 }
      );
    }

    const { studentInfo, examDate, examTime } = await request.json();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'IPLA Apprenticeship Exam',
              description: `Exam scheduled for ${new Date(examDate).toLocaleDateString()} at ${examTime}`,
              images: ['https://www.elevateforhumanity.org/images/logo.png'],
            },
            unit_amount: 15000, // $150.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/apprenticeships/ipla-exam/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/apprenticeships/ipla-exam`,
      customer_email: studentInfo.email,
      metadata: {
        studentName: studentInfo.name,
        studentEmail: studentInfo.email,
        studentPhone: studentInfo.phone,
        apprenticeshipProgram: studentInfo.apprenticeshipProgram,
        examDate: examDate,
        examTime: examTime,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
