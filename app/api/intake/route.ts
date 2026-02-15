import { logger } from '@/lib/logger';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// Auto-tag funding eligibility based on intake answers
function determineFundingTag(body: Record<string, string>): string {
  if (body.probation_or_reentry === 'true') return 'jri';
  if (body.funding_needed === 'false') return 'self-pay';
  if (body.workforce_connection === 'workone' || body.workforce_connection === 'employer-indy') return 'wioa';
  return 'pending-review';
}

export async function POST(req: Request) {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Service unavailable' },
      { status: 503 }
    );
  }

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!body.full_name?.trim()) {
    return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
  }

  const fundingTag = determineFundingTag(body);

  // Return undefined instead of null to avoid NOT NULL constraint issues
  // if columns are tightened later. Supabase-js omits undefined fields.
  function clean(v: unknown, max = 200): string | undefined {
    if (typeof v !== 'string') return undefined;
    const s = v.trim();
    if (!s) return undefined;
    return s.slice(0, max);
  }

  const { error } = await supabase
    .from('apprenticeship_intake')
    .insert([{
      full_name: body.full_name.trim(),
      email: clean(body.email),
      phone: clean(body.phone),
      city: clean(body.city),
      state: clean(body.state) || 'IN',
      program_interest: clean(body.program_interest) || 'barbering',
      employment_status: clean(body.employment_status),
      funding_needed: body.funding_needed !== 'false',
      workforce_connection: clean(body.workforce_connection),
      referral_source: clean(body.referral_source),
      probation_or_reentry: body.probation_or_reentry === 'true',
      preferred_location: clean(body.preferred_location),
      notes: clean(body.notes, 1000),
      funding_tag: fundingTag,
    }]);

  if (error) {
    logger.error('[Intake API]', error.message);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }

  return NextResponse.json({ success: true, funding_tag: fundingTag });
}
