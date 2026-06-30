import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

// PUBLIC ROUTE: donation endpoint — no auth required, rate-limited
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DONATION_AMOUNTS = [25, 50, 100, 250, 500, 1000];

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'payment');
  if (rateLimited) return rateLimited;

  const stripe = getStripe();
  if (!stripe) {
    return safeError('Donations are temporarily unavailable.', 503);
  }

  let body: {
    amount: number;
    recurring: boolean;
    donor_name?: string;
    donor_email?: string;
    dedication?: string;
    in_honor_of?: string;
  };

  try {
    body = await req.json();
  } catch {
    return safeError('Invalid request body.', 400);
  }

  const { amount, recurring, donor_name, donor_email, dedication, in_honor_of } = body;

  if (!amount || typeof amount !== 'number' || amount < 1 || amount > 100000) {
    return safeError('Invalid donation amount.', 400);
  }


  const siteUrl = ((process.env.NEXT_PUBLIC_SITE_URL || '').trim() || PLATFORM_DEFAULTS.siteUrl);
  const amountCents = Math.round(amount * 100);

  const metadata: Record<string, string> = {
    type: 'donation',
    organization: 'Sit Selfish Inc',
    partner: PLATFORM_DEFAULTS.orgName,
    ...(donor_name && { donor_name }),
    ...(donor_email && { donor_email }),
    ...(dedication && { dedication }),
    ...(in_honor_of && { in_honor_of }),
  };

  try {
    if (recurring) {
      // Recurring: create a Checkout Session with subscription
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Monthly Donation — Sit Selfish Inc / ' + PLATFORM_DEFAULTS.orgName + '',
                description:
                  'Your monthly gift funds workforce training, credentials, and career placement for underserved communities.',
                images: [`${siteUrl}/images/Elevate_for_Humanity_logo_81bf0fab.jpg`],
              },
              unit_amount: amountCents,
              recurring: { interval: 'month' },
            },
            quantity: 1,
          },
        ],
        customer_email: donor_email || undefined,
        metadata,
        success_url: `${siteUrl}/donate/thank-you?session_id={CHECKOUT_SESSION_ID}&recurring=true`,
        cancel_url: `${siteUrl}/donate?cancelled=true`,
      });
      return NextResponse.json({ url: session.url });
    } else {
      // One-time: create a Checkout Session
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Donation — Sit Selfish Inc / ${PLATFORM_DEFAULTS.orgName}',
                description:
                  'Your gift funds workforce training, credentials, and career placement for underserved communities.',
                images: [`${siteUrl}/images/Elevate_for_Humanity_logo_81bf0fab.jpg`],
              },
              unit_amount: amountCents,
            },
            quantity: 1,
          },
        ],
        customer_email: donor_email || undefined,
        metadata,
        submit_type: 'donate',
        success_url: `${siteUrl}/donate/thank-you?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/donate?cancelled=true`,
      });
      return NextResponse.json({ url: session.url });
    }
  } catch (err) {
    return safeInternalError(err, 'Failed to create donation session.');
  }
}
