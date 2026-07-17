// PUBLIC ROUTE: program pricing is public-facing (calculator on program pages)
import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/public';
import { safeError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const revalidate = 300; // 5-minute cache

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const slug = request.nextUrl.searchParams.get('slug');
  if (!slug) return safeError('slug is required', 400);

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
