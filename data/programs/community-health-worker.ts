import type { ProgramSchema } from '@/lib/programs/program-schema';

/** Community Health Worker — standalone ETPL pathway (slug: chw-cert / community-health). */
export const COMMUNITY_HEALTH_WORKER: ProgramSchema = {
  slug: 'chw-cert',
  title: 'Community Health Worker (CHW) Certification',
  subtitle:
    'Indiana CHW certification in 8–10 weeks. Bridge community health, outreach, and care navigation careers.',
  sector: 'healthcare',
  category: 'Healthcare & Human Services',
  programType: 'workforce',
  heroImage: '/images/pages/healthcare-classroom.webp',
  heroImageAlt: 'Community health worker supporting a patient in the community',
  deliveryMode: 'hybrid',
  deliveredBy: 'Elevate',
  durationWeeks: 9,
  hoursPerWeekMin: 15,
  hoursPerWeekMax: 20,
  hoursBreakdown: {
    onlineInstruction: 40,
    handsOnLab: 60,
    examPrep: 20,
    careerPlacement: 10,
  },
  schedule: 'Monthly cohort start — hybrid (online + community practicum)',
  cohortSize: '10–15 participants per cohort',
  fundingStatement:
    'WIOA and Workforce Ready Grant funding available for eligible Indiana residents. Self-pay available.',
  selfPayCost: '$3,800',
  fundingOptions: ['wioa', 'wrg', 'impact', 'self_pay'],
  badge: 'ETPL Listed',
  badgeColor: 'green',
  credentials: [
    {
      name: 'Indiana Community Health Worker Certificate',
      issuer: 'Indiana State Department of Health',
      description:
        'Credential for community-based health outreach, navigation, and education roles.',
      validity: 'Renewal per state requirements',
    },
  ],
  outcomes: [
    {
      statement: 'Conduct community needs assessments and connect clients to health and social services',
      assessedAt: 'Week 4',
    },
    {
      statement: 'Document client encounters and maintain HIPAA-compliant records',
      assessedAt: 'Week 6',
    },
    {
      statement: 'Complete supervised community practicum hours with competency sign-off',
      assessedAt: 'Week 9',
    },
    {
      statement: 'Educate individuals and families on health topics and preventive care',
      assessedAt: 'Week 5',
    },
    {
      statement: 'Demonstrate cultural competency and effective communication with diverse populations',
      assessedAt: 'Week 8',
    },
  ],
  careerPathway: [
    {
      title: 'Community Health Worker',
      timeframe: '0–1 year',
      requirements: 'CHW certificate + employer onboarding',
      salaryRange: 'Employer-set',
    },
  ],
  weeklySchedule: [],
  faqs: [],
  metaTitle: 'Community Health Worker (CHW) Certification | Elevate for Humanity',
  metaDescription:
    'Earn Indiana CHW certification in 8–10 weeks. WIOA and WRG funding available for eligible residents.',
  funding: {
    wioa_eligible: true,
    wrg_eligible: true,
    fssa_eligible: true,
    etpl_approved: true,
    fundingNotes: 'Indiana ETPL-listed community health worker pathway.',
  },
  enrollmentType: 'internal',
  deliveryModel: 'internal',
};
