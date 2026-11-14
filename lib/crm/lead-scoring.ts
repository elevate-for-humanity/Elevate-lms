/**
 * Lead Scoring Service
 * Basic qualification for inquiries/applications
 */

import type { SupabaseClient } from '@/lib/supabase';

export interface LeadData {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  source?: string;
  programInterest?: string;
  hasFunding?: boolean;
  hasWorkExperience?: boolean;
  hasHighSchoolDiploma?: boolean;
  age?: number;
}

export interface LeadScore {
  total: number;
  grade: 'hot' | 'warm' | 'cool' | 'cold';
  breakdown: {
    demographic: number;
    intent: number;
    engagement: number;
    funding: number;
  };
  factors: string[];
  recommendedAction: string;
}

const MAX_AGE = 65;
const MIN_AGE = 16;

/**
 * Calculate lead score based on available data
 */
export function scoreLead(data: Partial<LeadData>): LeadScore {
  const breakdown = {
    demographic: 0,
    intent: 0,
    engagement: 0,
    funding: 0,
  };
  const factors: string[] = [];

  // Demographics (0-30 points)
  // Age scoring
  if (data.age) {
    if (data.age >= 18 && data.age <= 35) {
      breakdown.demographic += 15;
      factors.push('Age 18-35 (prime workforce age)');
    } else if (data.age >= 36 && data.age <= 50) {
      breakdown.demographic += 10;
      factors.push('Age 36-50 (career change prime)');
    } else if (data.age >= 51 && data.age <= MAX_AGE) {
      breakdown.demographic += 5;
      factors.push('Age 51+ (career transition)');
    }
  } else {
    breakdown.demographic += 10; // Unknown age, assume eligible
    factors.push('Age not provided (assumed eligible)');
  }

  // Contact info completeness
  if (data.email) breakdown.demographic += 5;
  if (data.phone) {
    breakdown.demographic += 5;
    factors.push('Has phone number');
  }
  if (data.firstName && data.lastName) breakdown.demographic += 5;

  // Intent signals (0-35 points)
  const programInterest = (data.programInterest || '').toLowerCase();
  
  // High-demand programs
  if (programInterest.includes('barber') || 
      programInterest.includes('hvac') || 
      programInterest.includes('cdl') ||
      programInterest.includes('medical')) {
    breakdown.intent += 20;
    factors.push('High-demand program interest');
  } else if (programInterest) {
    breakdown.intent += 10;
    factors.push('Specific program selected');
  }

  // Clear employment goal
  if (data.hasWorkExperience) {
    breakdown.intent += 10;
    factors.push('Has relevant work experience');
  }

  // Basic eligibility
  if (data.hasHighSchoolDiploma) {
    breakdown.intent += 5;
    factors.push('Has high school diploma/GED');
  }

  // Funding status (0-25 points)
  if (data.hasFunding) {
    breakdown.funding += 25;
    factors.push('Has funding source identified');
  } else if (data.programInterest) {
    // Assume they might qualify for WIOA
    breakdown.funding += 10;
    factors.push('May qualify for workforce funding');
  }

  // Source quality (0-10 points)
  const source = (data.source || '').toLowerCase();
  if (source.includes('workone') || source.includes('referral') || source.includes('partner')) {
    breakdown.engagement += 10;
    factors.push('Warm referral source');
  } else if (source.includes('organic') || source.includes('google')) {
    breakdown.engagement += 5;
    factors.push('Organic search interest');
  } else if (source.includes('social') || source.includes('facebook') || source.includes('instagram')) {
    breakdown.engagement += 3;
    factors.push('Social media discovery');
  }

  const total = breakdown.demographic + breakdown.intent + breakdown.engagement + breakdown.funding;

  // Grade assignment
  let grade: LeadScore['grade'];
  let recommendedAction: string;

  if (total >= 70) {
    grade = 'hot';
    recommendedAction = 'Immediate contact - Schedule enrollment call today';
  } else if (total >= 45) {
    grade = 'warm';
    recommendedAction = 'Follow up within 24 hours - Send program info';
  } else if (total >= 25) {
    grade = 'cool';
    recommendedAction = 'Nurture sequence - Weekly email drip';
  } else {
    grade = 'cold';
    recommendedAction = 'Monthly check-in - Low priority';
  }

  return {
    total: Math.min(100, total),
    grade,
    breakdown,
    factors,
    recommendedAction,
  };
}

/**
 * Update lead score in database
 */
export async function updateLeadScore(
  supabase: SupabaseClient,
  email: string,
  leadData: Partial<LeadData>
): Promise<LeadScore> {
  const score = scoreLead(leadData);

  // Upsert lead record
  await supabase.from('leads').upsert({
    email: email.toLowerCase().trim(),
    first_name: leadData.firstName,
    last_name: leadData.lastName,
    phone: leadData.phone,
    source: leadData.source,
    program_interest: leadData.programInterest,
    funding_interest: leadData.hasFunding || false,
    score: score.total,
    status: score.grade === 'hot' ? 'qualified' : score.grade === 'warm' ? 'contacted' : 'new',
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'email',
  });

  return score;
}

/**
 * Auto-assign lead to recruiter based on workload
 */
export async function assignLeadToRecruiter(
  supabase: SupabaseClient,
  leadId: string
): Promise<string | null> {
  // Find recruiter with lowest current assignment
  const { data: recruiters } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'recruiter')
    .eq('is_active', true);

  if (!recruiters?.length) return null;

  // Count current leads per recruiter
  const { data: assignments } = await supabase
    .from('leads')
    .select('assigned_to')
    .in('assigned_to', recruiters.map(r => r.id))
    .eq('status', 'contacted');

  const workload = new Map<string, number>();
  recruiters.forEach(r => workload.set(r.id, 0));
  assignments?.forEach(a => {
    const current = workload.get(a.assigned_to) || 0;
    workload.set(a.assigned_to, current + 1);
  });

  // Assign to least busy recruiter
  let minId = recruiters[0].id;
  let minCount = workload.get(minId) || 0;
  workload.forEach((count, id) => {
    if (count < minCount) {
      minCount = count;
      minId = id;
    }
  });

  await supabase
    .from('leads')
    .update({ assigned_to: minId })
    .eq('id', leadId);

  return minId;
}
