import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Lazy initialization to avoid build-time errors
function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-01-27.acacia",
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    studentEmail,
    studentName,
    vendorId,
    vendorStripeAccountId,
  } = body;

  const priceCents = 149900; // $1,499
  const vendorAmountCents = 21300; // update to actual vendor cost
  const elevateAmountCents = priceCents - vendorAmountCents;

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: studentEmail,
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Online Certified Phlebotomy Technician Program",
            description: "100% online self-pay healthcare training program.",
            metadata: {
              program_slug: "phlebotomy-online",
              product_type: "course",
            },
          },
          unit_amount: priceCents,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: vendorStripeAccountId
      ? {
          application_fee_amount: elevateAmountCents,
          transfer_data: {
            destination: vendorStripeAccountId,
          },
        }
      : undefined,
    metadata: {
      program_slug: "phlebotomy-online",
      product_type: "course",
      funding_type: "self_pay",
      delivery: "online_self_paced",
      student_email: studentEmail,
      student_name: studentName,
      vendor_id: vendorId || "",
      vendor_amount_cents: String(vendorAmountCents),
      elevate_amount_cents: String(elevateAmountCents),
      course_access: "immediate",
      payout_mode: vendorStripeAccountId ? "stripe_connect" : "manual",
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/programs/phlebotomy-online?checkout=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
