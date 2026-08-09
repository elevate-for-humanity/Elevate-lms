// PUBLIC ROUTE: program pricing is public-facing (calculator on program pages)
import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/public';
import { safeError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getStaticProgram } from '@/data/programs/index';
import { getMinimumDepositCents } from '@/lib/programs/deposit-policy';

export const runtime = 'nodejs';
export const revalidate = 300;

function parseMoneyToCents(value?: string | null): number {
  if (!value) return 0;
  const dollars = Number(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(dollars) && dollars > 0 ? Math.round(dollars * 100) : 0;
}

function buildStaticPricing(slug: string) {
  const program = getStaticProgram(slug);
  if (!program) return null;

  const tuitionCents = parseMoneyToCents(program.selfPayCost);
  if (!tuitionCents) return null;

  const configuredDeposit = parseMoneyToCents(program.depositAmount);
  const depositMinCents = getMinimumDepositCents({
    slug: program.slug,
    tuitionCents,
    configuredDepositCents: configuredDeposit,
  });
  const depositDefaultCents = Math.min(
    tuitionCents,
    Math.max(depositMinCents, Math.round(tuitionCents * 0.35)),
  );
  const paymentWeeks = Math.max(4, Math.min(52, program.durationWeeks || 12));

  return {
    program_slug: program.slug,
    program_name: program.title,
    tuition_cents: tuitionCents,
    deposit_min_cents: depositMinCents,
    deposit_default_cents: depositDefaultCents,
    payment_frequency: 'weekly' as const,
    payment_weeks: paymentWeeks,
    stripe_deposit_url: null,
    stripe_full_url: null,
    notes:
      'Estimated self-pay schedule generated from the published program price. Final installment/BNPL terms are shown by Stripe and the selected payment provider at checkout.',
    source: 'static-program' as const,
  };
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const slug = request.nextUrl.searchParams.get('slug')?.trim();
  if (!slug) return safeError('slug is required', 400);

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('program_pricing')
      .select(
        'program_slug, program_name, tuition_cents, deposit_min_cents, deposit_default_cents, payment_frequency, payment_weeks, stripe_deposit_url, stripe_full_url, notes',
      )
      .eq('program_slug', slug)
      .eq('active', true)
      .maybeSingle();

    if (!error && data) {
      const tuitionCents = Number(data.tuition_cents || 0);
      const depositMinCents = getMinimumDepositCents({
        slug,
        tuitionCents,
        configuredDepositCents: Number(data.deposit_min_cents || 0),
      });
      const depositDefaultCents = Math.min(
        tuitionCents,
        Math.max(depositMinCents, Number(data.deposit_default_cents || depositMinCents)),
      );
      return NextResponse.json({
        ...data,
        deposit_min_cents: depositMinCents,
        deposit_default_cents: depositDefaultCents,
        source: 'program_pricing',
      });
    }
  } catch {
    // Static fallback below keeps the public calculator available if Supabase is unavailable.
  }

  const fallback = buildStaticPricing(slug);
  if (!fallback) return safeError('Pricing not found', 404);
  return NextResponse.json(fallback);
}
