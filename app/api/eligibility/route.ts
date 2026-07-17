// Funding eligibility check endpoint.
// Evaluates a participant's eligibility for WIOA, WRG, JRI, FSSA IMPACT, and employer-sponsored funding.
// Used by /check-eligibility page and workforce board eligibility view.
//
// GOVERNANCE: INTAKE_ONLY
// This endpoint performs LOCAL computation only — no data is stored, no PII is transmitted.
// Results are returned to the browser for display. No external agency is contacted.
// See lib/compliance/data-governance.ts for platform data governance policy.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

// PUBLIC ROUTE: eligibility screener — no PII stored, no auth required
// Rate-limited to prevent abuse

const eligibilitySchema = z.object({
  indiana_resident:       z.boolean(),
  us_citizen_or_eligible: z.boolean(),
  employed:               z.boolean(),
  income_below_threshold: z.boolean().optional(),
  receiving_snap:         z.boolean().optional(),
  receiving_tanf:         z.boolean().optional(),
  justice_involved:       z.boolean().optional(),
  veteran:                z.boolean().optional(),
  age:                    z.number().int().min(14).max(100).optional(),
  employer_sponsored:     z.boolean().optional(),
  program_slug:           z.string().optional(),
});

type EligibilityInput = z.infer<typeof eligibilitySchema>;

function evaluate(input: EligibilityInput) {
  const results: { stream: string; eligible: boolean; reason: string; cta: string }[] = [];

  // WIOA Title I — Adult / Dislocated Worker
  const wioaEligible = input.indiana_resident && input.us_citizen_or_eligible &&
    (input.income_below_threshold || !input.employed);
  results.push({
    stream: 'WIOA',
    eligible: wioaEligible,
    reason: wioaEligible
      ? 'You may qualify for free training through WIOA Title I.'
      : 'WIOA requires Indiana residency, work authorization, and low income or unemployment.',
    cta: '/funding/wioa',
  });

  // Workforce Ready Grant (WRG) — Indiana
  const wrgEligible = input.indiana_resident && input.us_citizen_or_eligible &&
    (input.age === undefined || input.age >= 25);
  results.push({
    stream: 'Workforce Ready Grant',
    eligible: wrgEligible,
    reason: wrgEligible
      ? 'You may qualify for the Indiana Workforce Ready Grant (adults 25+).'
      : 'WRG requires Indiana residency, work authorization, and age 25+.',
    cta: '/funding/wrg',
  });

  // FSSA IMPACT (SNAP E&T / TANF)
  const fssaEligible = !!(input.receiving_snap || input.receiving_tanf);
  results.push({
    stream: 'FSSA IMPACT',
    eligible: fssaEligible,
    reason: fssaEligible
      ? 'You may qualify for FSSA IMPACT training support through SNAP E&T or TANF.'
      : 'FSSA IMPACT requires active SNAP or TANF benefits.',
    cta: '/fssa',
  });

  // Job Ready Indy (JRI)
  const jriEligible = !!(input.justice_involved && input.indiana_resident);
  results.push({
    stream: 'Job Ready Indy (JRI)',
    eligible: jriEligible,
    reason: jriEligible
      ? 'You may qualify for JRI funding for justice-involved individuals.'
      : 'JRI is for justice-involved Indiana residents.',
    cta: '/jri',
  });

  // Employer-sponsored
  const employerEligible = !!(input.employer_sponsored);
  results.push({
    stream: 'Employer-Sponsored',
    eligible: employerEligible,
    reason: employerEligible
      ? 'Your employer may sponsor your training. Contact us to confirm.'
      : 'Ask your employer about OJT or tuition reimbursement programs.',
    cta: '/employer/apprenticeships',
  });

  const eligible = results.filter(r => r.eligible);
  const recommended = eligible[0] ?? results[0];

  return {
    eligible_streams: eligible.map(r => r.stream),
    recommended_stream: recommended.stream,
    recommended_cta: recommended.cta,
    all: results,
    next_step: eligible.length > 0 ? '/apply' : '/advising',
    message: eligible.length > 0
      ? `You may qualify for ${eligible.length} funding stream${eligible.length > 1 ? 's' : ''}. Apply now — it takes 5 minutes.`
      : 'You may still qualify for self-pay or payment plans. Talk to an advisor.',
  };
}

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'public');
  if (limited) return limited;

  let body: unknown;
  try { body = await request.json(); } catch { return safeError('Invalid JSON', 400); }

  const parsed = eligibilitySchema.safeParse(body);
  if (!parsed.success) return safeError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  try {
    const result = evaluate(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    return safeInternalError(err, 'Eligibility check failed');
  }
}

export async function GET(request: NextRequest) {
  // Quick GET version for simple query-param checks
  const limited = await applyRateLimit(request, 'public');
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const input: EligibilityInput = {
    indiana_resident:       searchParams.get('indiana') === 'true',
    us_citizen_or_eligible: searchParams.get('authorized') === 'true',
    employed:               searchParams.get('employed') === 'true',
    income_below_threshold: searchParams.get('low_income') === 'true',
    receiving_snap:         searchParams.get('snap') === 'true',
    receiving_tanf:         searchParams.get('tanf') === 'true',
    justice_involved:       searchParams.get('jri') === 'true',
    employer_sponsored:     searchParams.get('employer') === 'true',
    age:                    searchParams.get('age') ? parseInt(searchParams.get('age')!) : undefined,
  };

  try {
    return NextResponse.json(evaluate(input));
  } catch (err) {
    return safeInternalError(err, 'Eligibility check failed');
  }
}
