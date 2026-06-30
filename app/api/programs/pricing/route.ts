// PUBLIC ROUTE: program pricing is public-facing (calculator on program pages)
import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/public';
import { safeError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import {
  MIN_SETUP_FEE_CENTS,
  PAYMENT_TERM_WEEKS,
  TUITION_CENTS,
} from '@/lib/barber/pricing';

export const runtime = 'nodejs';
export const revalidate = 300; // 5-minute cache

const BARBER_STRIPE = {
  stripe_deposit_url: 'https://buy.stripe.com/8x2bJ21986rletw0dN8EN0o',
  stripe_full_url: 'https://buy.stripe.com/6oUdRa4lkaHB7141hR8EN0b',
} as const;

function barberPricingResponse(stripe?: {
  stripe_deposit_url: string | null;
  stripe_full_url: string | null;
}) {
  return {
    program_slug: 'barber-apprenticeship',
    program_name: 'Barber Apprenticeship',
    tuition_cents: TUITION_CENTS,
    deposit_min_cents: MIN_SETUP_FEE_CENTS,
    deposit_default_cents: MIN_SETUP_FEE_CENTS,
    payment_frequency: 'weekly' as const,
    payment_weeks: PAYMENT_TERM_WEEKS,
    stripe_deposit_url: stripe?.stripe_deposit_url ?? BARBER_STRIPE.stripe_deposit_url,
    stripe_full_url: stripe?.stripe_full_url ?? BARBER_STRIPE.stripe_full_url,
    notes: '$4,980 tuition. $600 minimum down, then 29 weekly payments or BNPL at checkout.',
  };
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const slug = request.nextUrl.searchParams.get('slug');
  if (!slug) return safeError('slug is required', 400);

  // Barber pricing authority lives in lib/barber/pricing.ts — never trust stale DB rows.
  if (slug === 'barber-apprenticeship') {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('program_pricing')
      .select('stripe_deposit_url, stripe_full_url')
      .eq('program_slug', slug)
      .eq('active', true)
      .maybeSingle();

    return NextResponse.json(barberPricingResponse(data ?? undefined));
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('program_pricing')
    .select(
      'program_slug, program_name, tuition_cents, deposit_min_cents, deposit_default_cents, payment_frequency, payment_weeks, stripe_deposit_url, stripe_full_url, notes',
    )
    .eq('program_slug', slug)
    .eq('active', true)
    .maybeSingle();

  if (error) return safeError('Failed to load pricing', 500);
  if (!data) return safeError('Pricing not found', 404);

  return NextResponse.json(data);
}
