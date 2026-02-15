import { getStripe } from '@/lib/stripe/client';
import { applyRateLimit } from '@/lib/api/withRateLimit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

  const stripe = getStripe();
  const body = await req.json();

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: body.items,
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cancel`,
  });

  return new Response(JSON.stringify({ id: session.id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
