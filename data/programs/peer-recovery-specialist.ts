import type { ProgramSchema } from '@/lib/programs/program-schema';

export const PEER_RECOVERY: ProgramSchema = {
  slug: 'peer-recovery-specialist',
  title: 'Peer Recovery Specialist',
  subtitle:
    'Earn your Indiana Certified Peer Recovery Specialist (CPRS) credential in 8 weeks. Help others overcome addiction and mental health challenges.',
  sector: 'healthcare',
  category: 'Healthcare & Human Services',
  programType: 'workforce',
  heroImage: '/images/pages/healthcare-hero.webp',
  heroImageAlt: 'Peer recovery specialist in a counseling session',
  deliveryMode: 'hybrid',
  deliveredBy: 'Elevate',
  durationWeeks: 8,
  hoursPerWeekMin: 20,
  hoursPerWeekMax: 25,
  hoursBreakdown: {
    onlineInstruction: 60,
    handsOnLab: 40,
    examPrep: 20,
    careerPlacement: 10,
  },
  schedule: 'Monthly enrollment — hybrid scheduling (online + in-person practicum)',
  cohortSize: '8–15 participants per cohort',
  selfPayCost: '$5,000',
  metaTitle: 'Peer Recovery Specialist (CPRS) | Indiana Certification | Elevate for Humanity',
  metaDescription:
    'Earn your Indiana Certified Peer Recovery Specialist (CPRS) credential in 8 weeks. WIOA funding available. Help others overcome addiction and mental health challenges.',
  fundingStatement: 'WIOA and FSSA IMPACT funding available for eligible Indiana residents.',
  fundingOptions: ['wioa', 'impact', 'self_pay'],
  badge: 'ETPL Approved',
  badgeColor: 'green',

  credentials: [
    {
      name: 'Indiana Certified Peer Recovery Specialist (CPRS)',
      issuer: 'Indiana Family and Social Services Administration (FSSA)',
      description:
        'State-recognized credential required to work as a peer recovery specialist in Indiana. Recognized by DMHA and Medicaid-certified providers.',
      validity: 'Biennial renewal',
    },
  ],

  outcomes: [
    {
      statement:
        'Articulate the peer support model, CPRS role boundaries, and ethics framework per Indiana DMHA standards.',
      assessedAt: 'Week 2',
    },
    {
      statement:
        'Demonstrate motivational interviewing techniques and active listening in supervised role-play scenarios.',
      assessedAt: 'Week 3',
    },
    {
      statement:
        'Identify adverse childhood experience (ACE) indicators and apply trauma-sensitive communication in case studies.',
      assessedAt: 'Week 4',
    },
    {
      statement:
        'Complete a safety plan template and demonstrate de-escalation in a simulated crisis scenario.',
      assessedAt: 'Week 5',
    },
    {
      statement:
        'Navigate Indiana FSSA systems, complete a referral packet, and document a mock client interaction.',
      assessedAt: 'Week 7',
    },
    {
      statement:
        'Pass CPRS practice exam at 80%+ and complete supervised practicum hours required for CPRS application.',
      assessedAt: 'Week 8',
    },
  ],

  careerPathway: [
    {
      title: 'Peer Recovery Specialist',
      timeframe: '0–3 months',
      requirements: 'Indiana CPRS credential',
      salaryRange: '$32,000–$42,000',
    },
    {
      title: 'Recovery Coach',
      timeframe: '1–2 years',
      requirements: 'CPRS + field experience',
      salaryRange: '$38,000–$50,000',
    },
    {
      title: 'Recovery Program Coordinator',
      timeframe: '3–5 years',
      requirements: 'CPRS + supervisory experience',
      salaryRange: '$48,000–$62,000',
    },
  ],

  weeklySchedule: [
    {
      week: 'Week 1–2',
      title: 'Introduction to Peer Recovery',
      competencyMilestone:
        'Articulate the peer support model, CPRS role boundaries, and ethics framework.',
    },
    {
      week: 'Week 3',
      title: 'Recovery Coaching Fundamentals',
      competencyMilestone:
        'Demonstrate motivational interviewing techniques and active listening in role-play scenarios.',
    },
    {
      week: 'Week 4',
      title: 'Trauma-Informed Care',
      competencyMilestone:
        'Identify ACE indicators and apply trauma-sensitive communication in case studies.',
    },
    {
      week: 'Week 5',
      title: 'Crisis Intervention & Safety Planning',
      competencyMilestone:
        'Complete a safety plan template and demonstrate de-escalation in a simulated crisis.',
    },
    {
      week: 'Week 6–7',
      title: 'Systems Navigation & Documentation',
      competencyMilestone:
        'Navigate Indiana FSSA systems, complete a referral packet, and document a mock client interaction.',
    },
    {
      week: 'Week 8',
      title: 'CPRS Exam Prep & Practicum',
      competencyMilestone:
        'Pass practice exam (80%+) and complete supervised practicum hours required for CPRS application.',
    },
  ],

  curriculum: [
    {
      title: 'Introduction to Peer Recovery',
      topics: [
        'History and philosophy of peer support',
        'CPRS roles, responsibilities, and ethics',
        'Indiana DMHA certification requirements',
        'Boundaries and scope of practice',
      ],
    },
    {
      title: 'Recovery Coaching Fundamentals',
      topics: [
        'Motivational interviewing techniques',
        'Active listening and person-centered planning',
        'Goal setting and recovery planning',
        'Strengths-based approaches',
      ],
    },
    {
      title: 'Trauma-Informed Care',
      topics: [
        'Understanding trauma and ACEs',
        'Trauma-sensitive communication',
        'Secondary traumatic stress and self-care',
        'Cultural humility in recovery support',
      ],
    },
    {
      title: 'Crisis Intervention & Safety Planning',
      topics: [
        'Recognizing crisis and warning signs',
        'De-escalation techniques',
        'Safety planning frameworks',
        'Mandatory reporting requirements',
      ],
    },
    {
      title: 'CPRS Exam Preparation & Practicum',
      topics: [
        'CPRS exam content review',
        'Supervised practicum hours',
        'FSSA certification application process',
        'Career pathways and employer connections',
      ],
    },
  ],

  breadcrumbs: [
    { label: 'Programs', href: '/programs' },
    { label: 'Healthcare & Human Services', href: '/programs/healthcare' },
    { label: 'Peer Recovery Specialist' },
  ],

  complianceAlignment: [
    {
      standard: 'Indiana ETPL Program ID',
      description: 'Approved on Indiana ETPL for WIOA Individual Training Account funding.',
    },
    {
      standard: 'Indiana DMHA CPRS Standards',
      description:
        'Curriculum aligned to Indiana Division of Mental Health and Addiction certification requirements.',
    },
    {
      standard: 'WIOA Title I',
      description: 'Program meets WIOA eligibility requirements for workforce funding.',
    },
  ],

  laborMarket: {
    medianSalary: 38000,
    salaryRange: '$32,000–$62,000',
    growthRate: '22%',
    source: 'Bureau of Labor Statistics',
    sourceYear: 2024,
    region: 'Indiana',
  },

  faqs: [
    {
      question: 'Do I need prior experience in healthcare or counseling?',
      answer:
        'No. Many successful peer recovery specialists have lived experience with recovery. The CPRS credential is designed for people who have personal experience with substance use or mental health challenges and want to help others.',
    },
    {
      question: 'Is WIOA funding available for this program?',
      answer:
        'Yes. This program is on the Indiana ETPL and qualifies for WIOA Individual Training Accounts (ITAs). Contact your local WorkOne center to check eligibility.',
    },
    {
      question: 'What can I do with a CPRS credential?',
      answer:
        'Work at community mental health centers, recovery community organizations, hospital systems, jails and prisons, and Medicaid-certified behavioral health providers across Indiana.',
    },
    {
      question: 'How long does it take to get the CPRS credential after completing the program?',
      answer:
        'After completing the program and practicum hours, you apply directly to Indiana FSSA DMHA. Processing typically takes 2–4 weeks.',
    },
  ],

  careers: [
    { title: 'Certified Peer Recovery Specialist (CPRS)', salary: '$32,000–$45,000' },
    { title: 'Recovery Coach', salary: '$34,000–$48,000' },
    { title: 'Case Manager — Behavioral Health', salary: '$38,000–$52,000' },
    { title: 'Substance Use Counselor (with additional licensure)', salary: '$45,000–$62,000' },
  ],

  admissionRequirements: [
    '18 years or older',
    'High school diploma or GED',
    'Personal lived experience with recovery (substance use or mental health) preferred',
    'Background check required — some employers may have restrictions',
  ],
  equipmentIncluded: 'All course materials, CPRS exam preparation resources, and practicum placement support included',
  modality: 'Hybrid — Online coursework via LMS, in-person practicum hours at approved sites',
  facilityInfo: 'Elevate training center, Indianapolis, with practicum placements at community behavioral health sites',
  employerPartners: [
    'Centerstone Indiana',
    'Volunteers of America Indiana',
    'Recovery community organizations',
    'Indiana community mental health centers',
  ],
  pricingIncludes: [
    '80 instructional hours',
    'CPRS exam preparation',
    'Practicum placement coordination',
    'All course materials',
    'Career placement support',
  ],
  paymentTerms:
    'WIOA and Workforce Ready Grant funding accepted for eligible Indiana residents. Self-pay option available with payment plans.',

  cta: {
    applyHref: '/programs/peer-recovery-specialist/apply',
    requestInfoHref: '/contact?program=peer-recovery-specialist',
    advisorHref: '/contact',
    courseHref: '/programs/peer-recovery-specialist',
  },


  funding: {
    wioa_eligible: true,
    fssa_eligible: true,
    wrg_eligible: true,
    jobReadyIndyEligible: true,
    fundingNotes: 'Indiana ETPL-listed. WIOA and FSSA IMPACT funding available. DMHA-recognized credential pathway.',
  },
};
