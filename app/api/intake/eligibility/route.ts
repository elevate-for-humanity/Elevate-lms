
import { createAdminClient } from '@/lib/supabase/admin';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// =====================================================
// INTAKE STAGE 2: ELIGIBILITY
// Pre-qualification before full application
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

const EligibilitySchema = z.object({
  leadId: z.string().uuid(),
  state: z.string().length(2),
  county: z.string().optional(),
  income: z.number().min(0),
  employmentStatus: z.enum(['employed', 'unemployed', 'underemployed', 'student']),
  age: z.number().min(16).max(100).optional(),
  hasHighSchoolDiploma: z.boolean(),
  isUSCitizen: z.boolean(),
});

interface EligibilityRules {
  state: string;
  incomeMax: number;
  employmentStatus: string[];
  requiresHighSchool: boolean;
  requiresCitizenship: boolean;
}

const FUNDING_RULES: Record<string, EligibilityRules> = {
  WIOA_IN: {
    state: 'IN',
    incomeMax: 60000,
    employmentStatus: ['unemployed', 'underemployed'],
    requiresHighSchool: false,
    requiresCitizenship: false,
  },
  WRG_IN: {
    state: 'IN',
    incomeMax: 50000,
    employmentStatus: ['unemployed'],
    requiresHighSchool: true,
    requiresCitizenship: true,
  },
  STATE_GRANT_IN: {
    state: 'IN',
    incomeMax: 75000,
    employmentStatus: ['employed', 'unemployed', 'underemployed'],
    requiresHighSchool: false,
    requiresCitizenship: false,
  },
};

function checkEligibility(data: z.infer<typeof EligibilitySchema>): {
  eligible: boolean;
  fundingTypes: string[];
  reasons: string[];
} {
  const eligibleFunding: string[] = [];
  const reasons: string[] = [];

  for (const [fundingType, rules] of Object.entries(FUNDING_RULES)) {
    if (rules.state !== data.state) continue;

    let qualifies = true;
    const localReasons: string[] = [];

    // Check income
    if (data.income > rules.incomeMax) {
      qualifies = false;
      localReasons.push(`Income exceeds ${fundingType} limit of $${rules.incomeMax}`);
    }

    // Check employment status
    if (!rules.employmentStatus.includes(data.employmentStatus)) {
      qualifies = false;
      localReasons.push(`${fundingType} requires ${rules.employmentStatus.join(' or ')} status`);
    }

    // Check high school diploma
    if (rules.requiresHighSchool && !data.hasHighSchoolDiploma) {
      qualifies = false;
      localReasons.push(`${fundingType} requires high school diploma or equivalent`);
    }

    // Check citizenship
    if (rules.requiresCitizenship && !data.isUSCitizen) {
      qualifies = false;
      localReasons.push(`${fundingType} requires US citizenship`);
    }

    if (qualifies) {
      eligibleFunding.push(fundingType);
    } else {
      reasons.push(...localReasons);
    }
  }

  return {
    eligible: eligibleFunding.length > 0,
    fundingTypes: eligibleFunding,
    reasons: reasons.length > 0 ? reasons : ['No funding programs match your current situation'],
  };
}

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const parsed = EligibilitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const supabase = await createServerSupabaseClient();

    // Verify lead exists
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, stage')
      .eq('id', data.leadId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Check eligibility
    const eligibility = checkEligibility(data);

    // Update lead
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        stage: eligibility.eligible ? 'ELIGIBLE' : 'INELIGIBLE',
        eligibility_data: {
          state: data.state,
          county: data.county,
          income: data.income,
          employment_status: data.employmentStatus,
          has_high_school_diploma: data.hasHighSchoolDiploma,
          is_us_citizen: data.isUSCitizen,
          funding_types: eligibility.fundingTypes,
          checked_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.leadId);

    if (updateError) {
      logger.error('Failed to update lead eligibility', { error: updateError, leadId: data.leadId });
      return NextResponse.json(
        { error: 'Failed to update eligibility' },
        { status: 500 }
      );
    }

    // Log event
    await supabase.from('audit_logs').insert({
      event_type: 'eligibility_checked',
      resource_type: 'lead',
      resource_id: data.leadId,
      metadata: {
        eligible: eligibility.eligible,
        funding_types: eligibility.fundingTypes,
        state: data.state,
      },
    });

    logger.info('Eligibility checked', {
      leadId: data.leadId,
      eligible: eligibility.eligible,
      fundingTypes: eligibility.fundingTypes,
    });

    if (eligibility.eligible) {
      return NextResponse.json({
        success: true,
        eligible: true,
        fundingTypes: eligibility.fundingTypes,
        nextStep: '/intake/application',
        message: `Great news! You may qualify for ${eligibility.fundingTypes.length} funding program(s). Let's complete your application.`,
      });
    } else {
      return NextResponse.json({
        success: true,
        eligible: false,
        reasons: eligibility.reasons,
        nextStep: '/resources',
        message: 'Based on your current situation, you may not qualify for funded training at this time. However, we have other resources that may help.',
      });
    }
  } catch (error) {
    logger.error('Eligibility check error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/intake/eligibility', _POST);
