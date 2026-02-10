import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Lazy initialization to avoid build-time errors when env vars are not set
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(key, {
    apiVersion: '2025-10-29.clover' as Stripe.LatestApiVersion,
  });
}

// Codebase license configurations (one-time purchase, not trial)
const LICENSES: Record<string, { 
  name: string; 
  price: number; 
  stripePriceId: string;
}> = {
  'starter-license': {
    name: 'Elevate LMS Starter License',
    price: 299,
    stripePriceId: 'price_1SqluuIRNf5vPH3A7VEoPwRw',
  },
  'pro-license': {
    name: 'Elevate LMS Pro License',
    price: 999,
    stripePriceId: 'price_1SqluuIRNf5vPH3AAHrdLDu3',
  },
  'enterprise-clone-license': {
    name: 'Elevate LMS Enterprise License',
    price: 5000,
    stripePriceId: 'price_1SqluuIRNf5vPH3ALcAcExyz',
  },
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const licenseSlug = searchParams.get('license');
  const email = searchParams.get('email');
  const name = searchParams.get('name');
  const company = searchParams.get('company');

  if (!licenseSlug || !email || !name) {
    return NextResponse.redirect(new URL('/store/licenses', request.url));
  }

  const license = LICENSES[licenseSlug];
  if (!license) {
    return NextResponse.redirect(new URL('/store/licenses', request.url));
  }

  try {
    const stripe = getStripe();
    // Create Stripe checkout session for codebase license purchase
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      metadata: {
        license_slug: licenseSlug,
        customer_name: name,
        company: company || '',
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: license.name,
              description: `One-time purchase. Includes codebase access and license key.`,
            },
            unit_amount: license.price * 100,
          },
          quantity: 1,
        },
      ],
      success_url: `${request.nextUrl.origin}/store/licenses/trial-success?session_id={CHECKOUT_SESSION_ID}&license=${licenseSlug}`,
      cancel_url: `${request.nextUrl.origin}/store/licenses/${licenseSlug}`,
    });

    if (session.url) {
      return NextResponse.redirect(session.url);
    }

    return NextResponse.redirect(new URL('/store/licenses', request.url));
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.redirect(new URL('/store/licenses?error=checkout_failed', request.url));
  }
}
