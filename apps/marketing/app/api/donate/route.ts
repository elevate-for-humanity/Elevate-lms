import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { LEGAL_PARTNER_LINE } from '@/lib/config/legal-entity';

// PUBLIC ROUTE: donation endpoint — no auth required, rate-limited
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    type: 'charitable_donation',
    organization: LEGAL_PARTNER_LINE,
    site_partner: PLATFORM_DEFAULTS.orgName,
    designation: 'general_charitable_support',
    ...(donor_name && { donor_name }),
    ...(donor_email && { donor_email }),
    ...(dedication && { dedication }),
    ...(in_honor_of && { in_honor_of }),
  };

  const productName = recurring
    ? `Monthly Donation — ${LEGAL_PARTNER_LINE}`
    : `Donation — ${LEGAL_PARTNER_LINE}`;
  const productDescription =
    'General charitable support for community and wraparound activities, subject to the nonprofit organization’s governing documents, available resources, and applicable law. A donation does not guarantee a benefit, scholarship, credential, training enrollment, funding award, job placement, or other participant outcome.';

  try {
    const common = {
      payment_method_types: ['card'] as Array<'card'>,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              description: productDescription,
              images: [`${siteUrl}/images/Elevate_for_Humanity_logo_81bf0fab.jpg`],
            },
            unit_amount: amountCents,
            ...(recurring ? { recurring: { interval: 'month' as const } } : {}),
          },
          quantity: 1,
        },
      ],
      customer_email: donor_email || undefined,
      metadata,
      cancel_url: `${siteUrl}/donate?cancelled=true`,
    };

    if (recurring) {
      const session = await stripe.checkout.sessions.create({
        ...common,
        mode: 'subscription',
        success_url: `${siteUrl}/donate/thank-you?session_id={CHECKOUT_SESSION_ID}&recurring=true`,
      });
      return NextResponse.json({ url: session.url });
    }

    const session = await stripe.checkout.sessions.create({
      ...common,
      mode: 'payment',
      submit_type: 'donate',
      success_url: `${siteUrl}/donate/thank-you?session_id={CHECKOUT_SESSION_ID}`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    return safeInternalError(err, 'Failed to create donation session.');
  }
}
