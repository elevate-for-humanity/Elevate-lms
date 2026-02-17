
export const runtime = 'nodejs';
export const maxDuration = 60;

import Stripe from "stripe";
import { NextResponse } from "next/server";
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';

const DIY_SERVICES = {
  review: {
    name: "Tax Return Review",
    price: 20000, // $200.00
  },
  consultation: {
    name: "Tax Consultation (1 hour)",
    price: 12500, // $125.00
  },
  guided: {
    name: "Guided Self-Filing Support",
    price: 30000, // $300.00
  },
  credit: {
    name: "Credit-Only Review",
    price: 15000, // $150.00
  },
};

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const { service_type, intake_id } = await req.json();

    if (!intake_id) {
      return NextResponse.json(
        { error: "Missing intake_id" },
        { status: 400 }
      );
    }

    const service = DIY_SERVICES[service_type as keyof typeof DIY_SERVICES];
    if (!service) {
      return NextResponse.json(
        { error: "Invalid service type" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ['card', 'affirm', 'klarna', 'afterpay_clearpay'],
      client_reference_id: intake_id,
      metadata: {
        intake_id,
        service_type: "tax_intake",
        diy_service: service_type,
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: service.name,
              description: "Self-Prepared Tax Support Service",
            },
            unit_amount: service.price,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/thank-you?service=${service_type}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/self-prepared-tax-support`,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
