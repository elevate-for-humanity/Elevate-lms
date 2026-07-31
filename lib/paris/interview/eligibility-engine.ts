import type { InterviewScore, EligibilityResult, FundingOption } from './types';

/**
 * Funding options by program and eligibility level
 */
const FUNDING_OPTIONS: Record<string, FundingOption[]> = {
  default: [
    {
      type: 'government',
      name: 'WIOA Adult Funding',
      coverage: 100,
      requirements: [
        'Must be 18 years or older',
        'Registered for selective service (males)',
        'Legal right to work in the US',
        'Demonstrated financial need',
        'Unemployed or underemployed'
      ],
      applicationUrl: '/funding/wioa-apply'
    },
    {
      type: 'government',
      name: 'SNAP Employment & Training',
      coverage: 100,
      requirements: [
        'Active SNAP benefits recipient',
        'Meet work requirements',
        'Registered with state E&T program',
        'Maintain SNAP eligibility'
      ],
      applicationUrl: '/funding/snap-apply'
    },
    {
      type: 'federal',
      name: 'Federal Pell Grant',
      coverage: 80,
      requirements: [
        'Complete FAFSA application',
        'Demonstrate financial need',
        'US citizen or eligible non-citizen',
        'Valid Social Security Number',
        'High school diploma or GED'
      ],
      applicationUrl: '/funding/pell-apply'
    },
    {
      type: 'self_pay',
      name: 'Self-Pay with Payment Plan',
      coverage: 0,
      requirements: [
        'Initial down payment of 20%',
        'Monthly payment agreement',
        'No credit check required',
        'Flexible payment terms available'
      ],
      applicationUrl: '/funding/payment-plan'
    },
    {
      type: 'employer',
      name: 'Employer Sponsorship',
      coverage: 100,
      requirements: [
        'Current employment verification',
        'Employer partnership agreement',
        'Letter of intent from employer',
        'Commitment to employment after completion'
      ],
      applicationUrl: '/funding/employer-sponsor'
    }
  ],
  'barber-apprenticeship': [
    {
      type: 'government',
      name: 'WIOA Adult Funding',
      coverage: 100,
      requirements: [
        'Must be 18 years or older',
        'Registered for selective service (males)',
        'Legal right to work in the US',
        'Demonstrated financial need',
        'Priority given to veterans and low-income individuals'
      ],
      applicationUrl: '/funding/wioa-apply'
    },
    {
      type: 'government',
      name: 'SNAP Employment & Training',
      coverage: 100,
      requirements: [
        'Active SNAP benefits recipient',
        'Meet work requirements',
        'Registered with state E&T program',
        'Barber licensing exam fee included'
      ],
      applicationUrl: '/funding/snap-apply'
    },
    {
      type: 'state',
      name: 'State Workforce Development Grant',
      coverage: 75,
      requirements: [
        'State residency requirement',
        'Enrollment in approved apprenticeship program',
        'Income eligibility guidelines',
        'Completion of state application'
      ],
      applicationUrl: '/funding/state-workforce'
    },
    {
      type: 'self_pay',
      name: 'Self-Pay with BNPL Option',
      coverage: 0,
      requirements: [
        'Initial down payment of 15%',
        '12-24 month payment plan',
        'No credit check required',
        'Early payoff available'
      ],
      applicationUrl: '/funding/payment-plan'
    }
  ],
  'cdl-training': [
    {
      type: 'government',
      name: 'WIOA Adult Funding',
      coverage: 100,
      requirements: [
        'Must be 18 years or older (21 for interstate)',
        'Registered for selective service (males)',
        'Clean driving record verification',
        'DOT physical eligibility',
        'Demonstrated financial need'
      ],
      applicationUrl: '/funding/wioa-apply'
    },
    {
      type: 'government',
      name: 'Trade Adjustment Assistance (TAA)',
      coverage: 100,
      requirements: [
        'Laid off due to foreign trade',
        'Certified as TAA eligible',
        'Enrollment in approved training',
        'Meet state TAA requirements'
      ],
      applicationUrl: '/funding/taa-apply'
    },
    {
      type: 'employer',
      name: 'CDL Company Sponsorship',
      coverage: 100,
      requirements: [
        'Employment commitment after training',
        'Signing bonus or tuition reimbursement agreement',
        'Background check clearance',
        'Company-specific requirements'
      ],
      applicationUrl: '/funding/cdl-sponsorship'
    },
    {
      type: 'self_pay',
      name: 'Self-Pay with Payment Plan',
      coverage: 0,
      requirements: [
        'Initial down payment of $1,500',
        'Monthly payments over 12-18 months',
        'No credit check required',
        'CDL testing fees included'
      ],
      applicationUrl: '/funding/payment-plan'
    }
  ],
  'hvac': [
    {
      type: 'government',
      name: 'WIOA Adult Funding',
      coverage: 100,
      requirements: [
        'Must be 18 years or older',
        'Registered for selective service (males)',
        'Legal right to work in the US',
        'Demonstrated financial need',
        'Interest in skilled trades career'
      ],
      applicationUrl: '/funding/wioa-apply'
    },
    {
      type: 'federal',
      name: 'Federal Pell Grant',
      coverage: 80,
      requirements: [
        'Complete FAFSA application',
        'Demonstrate financial need',
        'US citizen or eligible non-citizen',
        'EPA 608 exam fee may be covered'
      ],
      applicationUrl: '/funding/pell-apply'
    },
    {
      type: 'industry',
      name: 'HVAC Excellence Scholarship',
      coverage: 50,
      requirements: [
        'Enrollment in HVAC program',
        'Minimum 2.5 GPA',
        'Letter of recommendation',
        'Statement of career goals'
      ],
      applicationUrl: '/funding/hvac-scholarship'
    },
    {
      type: 'self_pay',
      name: 'Self-Pay with Payment Plan',
      coverage: 0,
      requirements: [
        'Initial down payment of 20%',
        'Monthly payment agreement',
        'EPA 608 certification included',
        'Tool kit included in tuition'
      ],
      applicationUrl: '/funding/payment-plan'
    }
  ],
  'medical-assistant': [
    {
      type: 'government',
      name: 'WIOA Adult Funding',
      coverage: 100,
      requirements: [
        'Must be 18 years or older',
        'Registered for selective service (males)',
        'Legal right to work in the US',
        'Demonstrated financial need',
        'Healthcare career interest'
      ],
      applicationUrl: '/funding/wioa-apply'
    },
    {
      type: 'federal',
      name: 'Federal Pell Grant',
      coverage: 85,
      requirements: [
        'Complete FAFSA application',
        'Demonstrate financial need',
        'US citizen or eligible non-citizen',
        'CMA certification exam fee may be covered'
      ],
      applicationUrl: '/funding/pell-apply'
    },
    {
      type: 'state',
      name: 'Healthcare Workforce Grant',
      coverage: 60,
      requirements: [
        'State residency requirement',
        'Enrollment in approved healthcare program',
        'Commitment to work in underserved area',
        'Maintain minimum GPA'
      ],
      applicationUrl: '/funding/healthcare-grant'
    },
    {
      type: 'self_pay',
      name: 'Self-Pay with Payment Plan',
      coverage: 0,
      requirements: [
        'Initial down payment of 15%',
        'Monthly payments over 12-24 months',
        'CMA exam prep materials included',
        'Clinical externship placement included'
      ],
      applicationUrl: '/funding/payment-plan'
    }
  ],
  'cosmetology': [
    {
      type: 'government',
      name: 'WIOA Adult Funding',
      coverage: 100,
      requirements: [
        'Must be 18 years or older',
        'Registered for selective service (males)',
        'Legal right to work in the US',
        'Demonstrated financial need',
        'Beauty industry career interest'
      ],
      applicationUrl: '/funding/wioa-apply'
    },
    {
      type: 'government',
      name: 'SNAP Employment & Training',
      coverage: 100,
      requirements: [
        'Active SNAP benefits recipient',
        'Meet work requirements',
        'State licensing exam fees covered',
        'Kit and supplies assistance available'
      ],
      applicationUrl: '/funding/snap-apply'
    },
    {
      type: 'self_pay',
      name: 'Self-Pay with BNPL',
      coverage: 0,
      requirements: [
        'Initial down payment of 10%',
        '18-24 month payment plan',
        'State board exam fees included',
        'Professional kit included'
      ],
      applicationUrl: '/funding/payment-plan'
    }
  ],
  'phlebotomy': [
    {
      type: 'government',
      name: 'WIOA Adult Funding',
      coverage: 100,
      requirements: [
        'Must be 18 years or older',
        'Registered for selective service (males)',
        'Legal right to work in the US',
        'Demonstrated financial need',
        'Healthcare career interest'
      ],
      applicationUrl: '/funding/wioa-apply'
    },
    {
      type: 'federal',
      name: 'Federal Pell Grant',
      coverage: 90,
      requirements: [
        'Complete FAFSA application',
        'Demonstrate financial need',
        'US citizen or eligible non-citizen',
        'NCPT certification exam included'
      ],
      applicationUrl: '/funding/pell-apply'
    },
    {
      type: 'self_pay',
      name: 'Self-Pay with Payment Plan',
      coverage: 0,
      requirements: [
        'Initial down payment of 15%',
        'Monthly payments over 6-12 months',
        'Clinical rotation site placement included',
        'National certification exam prep included'
      ],
      applicationUrl: '/funding/payment-plan'
    }
  ]
};

/**
 * Determine eligibility based on interview score and program
 */
export function determineEligibility(
  interviewScore: InterviewScore,
  programSlug: string
): EligibilityResult {
  const { eligibility, riskLevel, percentage } = interviewScore;
  
  let eligible: boolean;
  let reason: string;
  let nextSteps: string[];
  
  switch (eligibility) {
    case 'eligible':
      eligible = true;
      reason = `Congratulations! You have demonstrated the qualifications and motivation needed for this program.`;
      nextSteps = [
        'Complete all required documents',
        'Upload identification and proof of eligibility',
        'Complete funding verification process',
        'Schedule enrollment approval interview',
        'Review and sign enrollment agreement'
      ];
      break;
      
    case 'review':
      eligible = false;
      reason = `Your application requires additional review by our admissions team. Some areas may need clarification or supporting documentation.`;
      nextSteps = [
        'Admissions review required',
        'Additional documentation may be needed',
        'Our team will contact you within 2-3 business days',
        'You may be contacted for an in-person interview',
        'Ensure all contact information is up to date'
      ];
      break;
      
    case 'denied':
      eligible = false;
      reason = `Unfortunately, based on the interview responses, this program may not be the right fit at this time. This decision is not permanent - you may reapply after addressing the specific concerns noted.`;
      nextSteps = [
        'Review the specific areas that affected your eligibility',
        'Consider addressing any skill gaps before reapplying',
        'Contact admissions for guidance on improvement areas',
        'Explore alternative programs that may be a better fit',
        'You may reapply after a 90-day waiting period'
      ];
      break;
  }
  
  const fundingRecommendations = getFundingRecommendations(programSlug, eligibility);
  
  return {
    eligible,
    status: eligibility,
    reason,
    riskLevel,
    fundingRecommendations,
    nextSteps
  };
}

/**
 * Get funding recommendations based on program and eligibility
 */
export function getFundingRecommendations(
  programSlug: string,
  eligibility: 'eligible' | 'review' | 'denied'
): FundingOption[] {
  const options = FUNDING_OPTIONS[programSlug] || FUNDING_OPTIONS.default;
  
  if (eligibility === 'denied') {
    return options.filter(opt => opt.type === 'self_pay');
  }
  
  if (eligibility === 'review') {
    return options;
  }
  
  return [...options].sort((a, b) => {
    if (a.type === 'self_pay' && b.type !== 'self_pay') return 1;
    if (b.type === 'self_pay' && a.type !== 'self_pay') return -1;
    return b.coverage - a.coverage;
  });
}

/**
 * Check if a specific funding option is available
 */
export function isFundingOptionAvailable(
  fundingType: string,
  programSlug: string,
  eligibility: 'eligible' | 'review' | 'denied'
): boolean {
  const options = getFundingRecommendations(programSlug, eligibility);
  return options.some(opt => opt.type === fundingType);
}

/**
 * Get estimated total cost for a program
 */
export function getProgramCostEstimate(programSlug: string): {
  tuition: number;
  fees: number;
  materials: number;
  certification: number;
  total: number;
} {
  const costEstimates: Record<string, { tuition: number; fees: number; materials: number; certification: number }> = {
    default: { tuition: 5000, fees: 500, materials: 300, certification: 200 },
    'barber-apprenticeship': { tuition: 8500, fees: 750, materials: 500, certification: 250 },
    'cdl-training': { tuition: 7000, fees: 800, materials: 400, certification: 300 },
    'hvac': { tuition: 12000, fees: 1000, materials: 800, certification: 350 },
    'medical-assistant': { tuition: 9500, fees: 850, materials: 600, certification: 275 },
    'cosmetology': { tuition: 8000, fees: 700, materials: 550, certification: 225 },
    'phlebotomy': { tuition: 3500, fees: 400, materials: 250, certification: 150 }
  };
  
  const defaultCost = { tuition: 5000, fees: 500, materials: 300, certification: 200 };
  const costs = costEstimates[programSlug] || defaultCost;
  
  return {
    ...costs,
    total: costs.tuition + costs.fees + costs.materials + costs.certification
  };
}

export default {
  determineEligibility,
  getFundingRecommendations,
  isFundingOptionAvailable,
  getProgramCostEstimate
};
