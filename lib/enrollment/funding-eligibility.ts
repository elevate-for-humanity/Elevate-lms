/**
 * Funding source eligibility engine.
 *
 * Determines which funding sources a student qualifies for based on their
 * application answers. Does NOT make the final determination for WorkOne/WIOA —
 * that is WorkOne's job. This engine:
 *
 *   1. Evaluates which sources the student is POTENTIALLY eligible for
 *      based on income, employment status, household size, and program.
 *   2. Returns a ranked list of options with instructions for each.
 *   3. For WorkOne/WIOA: flags that the student must complete WorkOne intake
 *      BEFORE the application is accepted — Elevate cannot approve this.
 *   4. Always includes self_pay as a fallback.
 *
 * WorkOne determines WIOA eligibility. Elevate does not override that.
 * If a student selects WorkOne/WIOA and does not have a WorkOne approval
 * letter, their application is held at status='pending_workone' until
 * they return with confirmation.
 *
 * 2025 Federal Poverty Level guidelines (48 contiguous states):
 *   https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines
 *
 * Indiana Workforce Ready Grant income limit: 200% FPL
 * WIOA low-income threshold: 70% Lower Living Standard Income Level (LLSIL)
 *   — approximated here as 150% FPL for intake screening purposes.
 *   WorkOne makes the authoritative determination.
 */

// ─── 2025 FPL base figures ────────────────────────────────────────────────────

const FPL_BASE = 15060;   // 1-person household
const FPL_PER_ADDITIONAL = 5380; // each additional person

export function fplForHousehold(size: number): number {
  const s = Math.max(1, size);
  return FPL_BASE + (s - 1) * FPL_PER_ADDITIONAL;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type FundingSource =
  | 'workone_wioa'          // WorkOne-administered WIOA Title I
  | 'workforce_ready_grant' // Indiana Workforce Ready Grant (DWD)
  | 'jri'                   // Justice Reinvestment Initiative
  | 'impact_partnership'    // Elevate partner-funded (e.g. Impact)
  | 'employer_sponsored'    // Employer pays
  | 'self_pay';             // Student pays out of pocket

export type EligibilityStatus =
  | 'likely_eligible'       // Meets screening criteria — must still be verified
  | 'possible'              // May qualify — needs more info or external determination
  | 'not_eligible'          // Does not meet criteria
  | 'requires_external';    // External agency (WorkOne) makes the determination

export interface FundingOption {
  source: FundingSource;
  label: string;
  status: EligibilityStatus;
  /** Short reason shown to student */
  reason: string;
  /** Step-by-step instructions shown before the student can select this option */
  instructions: string[];
  /** External URL the student must visit before applying */
  externalUrl?: string;
  /** If true, student must confirm external approval before form submits */
  requiresExternalConfirmation: boolean;
  /** Maps to student_enrollments.funding_source */
  enrollmentFundingSource: string;
}

export interface EligibilityInput {
  employmentStatus: 'unemployed' | 'part_time' | 'full_time' | 'student' | string;
  householdSize: number;
  annualIncomeUsd: number;
  /** Whether student has been involved in the justice system */
  justiceInvolved?: boolean;
  /** Whether an employer is offering to sponsor */
  hasEmployerSponsor?: boolean;
  /** Whether student has a WorkOne approval letter in hand */
  hasWorkOneApproval?: boolean;
  /** Program slug — some funding sources are program-specific */
  programSlug?: string;
}

export interface EligibilityResult {
  /** Ranked list — best option first, self_pay always last */
  options: FundingOption[];
  /** The recommended option (first likely_eligible, else first possible, else self_pay) */
  recommended: FundingOption;
  /** True if any sponsored option is likely_eligible or possible */
  hasSponsoredOption: boolean;
}

// ─── Engine ───────────────────────────────────────────────────────────────────

export function evaluateFundingEligibility(input: EligibilityInput): EligibilityResult {
  const {
    employmentStatus,
    householdSize,
    annualIncomeUsd,
    justiceInvolved = false,
    hasEmployerSponsor = false,
    hasWorkOneApproval = false,
    programSlug = '',
  } = input;

  const fpl = fplForHousehold(householdSize);
  const incomeRatio = annualIncomeUsd / fpl; // e.g. 1.5 = 150% FPL
  const isUnemployedOrPartTime = ['unemployed', 'part_time'].includes(employmentStatus);
  const isBarberProgram = programSlug.includes('barber');

  const options: FundingOption[] = [];

  // ── 1. WorkOne / WIOA ──────────────────────────────────────────────────────
  // Barber apprenticeship is always self-pay — WorkOne does not fund it.
  if (!isBarberProgram) {
    const wioa_likely = isUnemployedOrPartTime && incomeRatio <= 1.5;
    const wioa_possible = incomeRatio <= 2.0 || isUnemployedOrPartTime;

    options.push({
      source: 'workone_wioa',
      label: 'WorkOne / WIOA (Free Training)',
      status: wioa_likely ? 'likely_eligible' : wioa_possible ? 'possible' : 'requires_external',
      reason: wioa_likely
        ? 'Based on your income and employment status, you may qualify for free training through WorkOne.'
        : wioa_possible
        ? 'You may qualify for WorkOne funding. WorkOne will make the final determination.'
        : 'You may not meet standard WIOA income criteria, but WorkOne can still assess your situation.',
      instructions: [
        'Contact your local WorkOne center before completing this application.',
        'Tell them you are enrolling in training with Elevate for Humanity and need a WIOA or Workforce Ready Grant eligibility determination.',
        'WorkOne will review your income, employment history, and program eligibility.',
        'Once approved, WorkOne will provide a letter or authorization code. Bring that back here to complete your application.',
        'Your application will be held until WorkOne confirms your eligibility.',
      ],
      externalUrl: 'https://www.in.gov/dwd/workone/workone-locations/',
      requiresExternalConfirmation: true,
      enrollmentFundingSource: 'workone',
    });
  }

  // ── 2. Indiana Workforce Ready Grant ──────────────────────────────────────
  // Income ≤ 200% FPL, pursuing a high-value credential, Indiana resident.
  if (!isBarberProgram) {
    const wrg_eligible = incomeRatio <= 2.0;
    options.push({
      source: 'workforce_ready_grant',
      label: 'Indiana Workforce Ready Grant',
      status: wrg_eligible ? 'likely_eligible' : 'not_eligible',
      reason: wrg_eligible
        ? 'Your household income may qualify you for the Indiana Workforce Ready Grant, which covers tuition for high-demand careers.'
        : 'The Workforce Ready Grant requires household income at or below 200% of the federal poverty level.',
      instructions: [
        'The Workforce Ready Grant is administered through WorkOne.',
        'Visit your local WorkOne center and ask specifically about the Workforce Ready Grant for your program.',
        'You will need to provide proof of Indiana residency and income documentation.',
        'WorkOne will issue an authorization. Return here with that authorization to complete enrollment.',
      ],
      externalUrl: 'https://www.in.gov/dwd/workone/workforce-ready-grant/',
      requiresExternalConfirmation: true,
      enrollmentFundingSource: 'workforce_ready_grant',
    });
  }

  // ── 3. Justice Reinvestment Initiative (JRI) ──────────────────────────────
  // For justice-involved individuals. Program-specific (PRS, some HVAC cohorts).
  if (justiceInvolved) {
    options.push({
      source: 'jri',
      label: 'Justice Reinvestment Initiative (JRI)',
      status: 'likely_eligible',
      reason: 'JRI funding is available for justice-involved individuals in qualifying programs.',
      instructions: [
        'JRI funding is coordinated through your case manager or reentry coordinator.',
        'Contact Elevate directly at 317-314-3757 to confirm your program qualifies for JRI funding.',
        'You will need documentation of your justice-involved status.',
      ],
      requiresExternalConfirmation: false,
      enrollmentFundingSource: 'jri',
    });
  }

  // ── 4. Partner-funded (e.g. Impact, employer cohorts) ─────────────────────
  // Available when Elevate has an active partnership that covers tuition.
  // This is set at the program level — shown only when the program supports it.
  // For now flagged as 'possible' since partnership availability varies.
  options.push({
    source: 'impact_partnership',
    label: 'Partner-Funded Scholarship',
    status: 'possible',
    reason: 'Elevate partners with community organizations that may cover your tuition. Availability depends on your program and current funding.',
    instructions: [
      'Contact Elevate at 317-314-3757 or info@elevateforhumanity.org to ask about partner-funded seats in your program.',
      'Partner funding is limited and awarded on a first-come, first-served basis.',
      'If a partner-funded seat is available, Elevate will confirm and update your application.',
    ],
    requiresExternalConfirmation: false,
    enrollmentFundingSource: 'partner',
  });

  // ── 5. Employer-sponsored ─────────────────────────────────────────────────
  if (hasEmployerSponsor) {
    options.push({
      source: 'employer_sponsored',
      label: 'Employer-Sponsored',
      status: 'likely_eligible',
      reason: 'Your employer has agreed to sponsor your training.',
      instructions: [
        'Ask your employer to contact Elevate at 317-314-3757 to set up a sponsorship agreement.',
        'Your employer will receive an invoice directly.',
      ],
      requiresExternalConfirmation: false,
      enrollmentFundingSource: 'employer_sponsored',
    });
  }

  // ── 6. Self-pay (always available) ────────────────────────────────────────
  options.push({
    source: 'self_pay',
    label: 'Self-Pay / Payment Plan',
    status: 'likely_eligible',
    reason: 'Pay tuition directly. Payment plans are available.',
    instructions: [
      'You will pay tuition directly to Elevate.',
      'Payment plans are available — contact us at 317-314-3757 to discuss options.',
    ],
    requiresExternalConfirmation: false,
    enrollmentFundingSource: 'self_pay',
  });

  // ── Rank: likely_eligible first, then possible, then not_eligible ─────────
  const rank: Record<EligibilityStatus, number> = {
    likely_eligible: 0,
    requires_external: 1,
    possible: 2,
    not_eligible: 3,
  };
  options.sort((a, b) => rank[a.status] - rank[b.status]);

  // Recommended = first sponsored option that isn't not_eligible, else self_pay
  const recommended =
    options.find(o => o.source !== 'self_pay' && o.status !== 'not_eligible') ??
    options.find(o => o.source === 'self_pay')!;

  const hasSponsoredOption = options.some(
    o => o.source !== 'self_pay' && o.status !== 'not_eligible',
  );

  return { options, recommended, hasSponsoredOption };
}

// ─── DB-friendly summary ──────────────────────────────────────────────────────

export interface EligibilitySummary {
  requested_source: string;
  evaluated_options: string[];
  recommended_source: string;
  requires_workone: boolean;
  has_sponsored_option: boolean;
  evaluated_at: string;
}

export function toEligibilitySummary(
  input: EligibilityInput,
  result: EligibilityResult,
  requestedSource: string,
): EligibilitySummary {
  return {
    requested_source: requestedSource,
    evaluated_options: result.options
      .filter(o => o.status !== 'not_eligible')
      .map(o => o.enrollmentFundingSource),
    recommended_source: result.recommended.enrollmentFundingSource,
    requires_workone: result.options.some(
      o => o.source === 'workone_wioa' && o.requiresExternalConfirmation,
    ),
    has_sponsored_option: result.hasSponsoredOption,
    evaluated_at: new Date().toISOString(),
  };
}
