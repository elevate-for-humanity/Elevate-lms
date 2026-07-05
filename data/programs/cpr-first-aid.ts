import type { ProgramSchema } from '@/lib/programs/program-schema';

export const CPR_FIRST_AID: ProgramSchema = {
  slug: 'cpr-first-aid',
  title: 'CPR & First Aid Certification',
  subtitle: '$130 · Live instructor · Mannequin shipped to your door · HSI certification · Train from home',
  sector: 'healthcare',
  category: 'Emergency Response',
  programType: 'certification',
  heroImage: '/images/pages/cpr-mannequin.webp',
  heroImageAlt: 'CPR training mannequin for at-home certification',
  videoSrc: '',
  deliveryMode: 'online',
  deliveredBy: 'Elevate',
  durationWeeks: 1,
  hoursPerWeekMin: 2,
  hoursPerWeekMax: 4,
  hoursBreakdown: { onlineInstruction: 2, handsOnLab: 2, examPrep: 0, careerPlacement: 0 },
  schedule: 'Flexible scheduling — complete in a single session from home',
  cohortSize: 'Small group sessions with live instructor',
  fundingStatement: 'Included free with any Elevate training program',
  selfPayCost: '$130',
  badge: 'Train From Home',
  badgeColor: 'red',
  credentials: [
    {
      name: 'CPR/AED Certification',
      issuer: 'Health & Safety Institute (HSI)',
      description: 'CPR and AED certification for healthcare and workplace settings. Nationally recognized, meets employer requirements.',
      validity: '2 years',
    },
    {
      name: 'First Aid Certification',
      issuer: 'Health & Safety Institute (HSI)',
      description: 'First aid skills for workplace and community emergencies.',
      validity: '2 years',
    },
    {
      name: 'Bloodborne Pathogens',
      issuer: 'Health & Safety Institute (HSI)',
      description: 'OSHA-compliant bloodborne pathogens awareness and exposure control.',
      validity: '1 year',
    },
  ],
  outcomes: [
    {
      statement: 'Perform high-quality CPR on adult, child, and infant mannequins',
      assessedAt: 'Day 1',
    },
    {
      statement: 'Operate an AED correctly within 2 minutes of simulated cardiac arrest',
      assessedAt: 'Day 1',
    },
    {
      statement: 'Demonstrate choking relief techniques for conscious and unconscious victims',
      assessedAt: 'Day 1',
    },
    {
      statement: 'Apply first aid for bleeding, burns, fractures, and allergic reactions',
      assessedAt: 'Day 1',
    },
    { statement: 'Pass AHA written and skills evaluation', assessedAt: 'Day 1' },
  ],
  careerPathway: [
    {
      title: 'CPR/First Aid Certified',
      timeframe: 'Same day',
      requirements: 'Complete course',
      salaryRange: 'Prerequisite for many jobs',
    },
    {
      title: 'Healthcare Entry (CNA, MA)',
      timeframe: '1–6 months',
      requirements: 'CPR + healthcare program',
      salaryRange: '$30,000–$40,000',
    },
    {
      title: 'EMT / Paramedic',
      timeframe: '6–24 months',
      requirements: 'EMT program + NREMT',
      salaryRange: '$35,000–$55,000',
    },
  ],
  weeklySchedule: [
    {
      week: 'Morning',
      title: 'CPR & AED Skills',
      competencyMilestone: 'Perform CPR and use AED on adult, child, and infant mannequins',
    },
    {
      week: 'Afternoon',
      title: 'First Aid & Evaluation',
      competencyMilestone: 'Demonstrate first aid skills and pass written/practical exam',
    },
  ],
  curriculum: [
    {
      title: 'CPR Skills',
      topics: [
        'Adult CPR technique',
        'Child and infant CPR',
        'Compression depth and rate',
        'Rescue breathing',
        'Team CPR',
      ],
    },
    {
      title: 'AED Operation',
      topics: [
        'AED pad placement',
        'Shock delivery protocol',
        'Special situations (water, pacemaker)',
        'AED maintenance awareness',
      ],
    },
    {
      title: 'First Aid',
      topics: [
        'Bleeding control and wound care',
        'Burns and electrical injuries',
        'Fractures and sprains',
        'Allergic reactions and epinephrine',
        'Stroke and heart attack recognition',
      ],
    },
  ],
  complianceAlignment: [
    {
      standard: 'ILCOR / ECC Guidelines',
      description: 'Training follows current International Liaison Committee on Resuscitation CPR and ECC guidelines as implemented by HSI.',
    },
    {
      standard: 'OSHA Workplace First Aid',
      description: 'Meets OSHA requirements for workplace first aid training.',
    },
  ],
  credentialPipeline: [
    {
      training: 'CPR/AED/First Aid (1 day)',
      certification: 'HSI CPR/AED & First Aid',
      certBody: 'Health & Safety Institute (HSI)',
      jobRole: 'Healthcare, Construction, Childcare, Fitness',
    },
  ],
  laborMarket: {
    medianSalary: 0,
    salaryRange: 'Prerequisite credential',
    growthRate: 'Required for most healthcare and safety positions',
    source: 'Bureau of Labor Statistics',
    sourceYear: 2024,
    region: 'National',
  },
  careers: [
    { title: 'CNA (with additional training)', salary: '$30,000–$38,000' },
    { title: 'Medical Assistant (with additional training)', salary: '$35,000–$42,000' },
    { title: 'Construction Worker (OSHA + CPR)', salary: '$32,000–$45,000' },
  ],
  cta: {
    applyHref: '/apply?program=cpr-first-aid',
    requestInfoHref: '/programs/cpr-first-aid/request-info',
    advisorHref: '/contact',
    courseHref: '/programs/cpr-first-aid',
  },
  admissionRequirements: [
    '16 years or older',
    'No prerequisites',
    'No prior medical training required',
  ],
  equipmentIncluded:
    'Training mannequin shipped directly to your home. AED trainer and certification card included.',
  modality: 'Online — live instructor-led session. Train from the comfort of your own home.',
  facilityInfo: 'Remote — mannequin shipped to your address anywhere in the U.S.',
  employerPartners: ['Required by most healthcare, construction, and childcare employers'],
  pricingIncludes: [
    'AHA course materials',
    'Hands-on skills practice',
    'Written and practical evaluation',
    'AHA certification card (2-year validity)',
  ],
  paymentTerms: 'Included free with any Elevate program enrollment. Stand-alone: $130.',
  // ─── Content model ──────────────────────────────────────────────
  deliveryModel: 'partner',
  deliveryModelDetail: 'partner_scorm',
  partnerProvider: 'hsi',
  fundingOptions: ['self_pay'],
  enrollmentType: 'internal',
  partnerCourses: [
    {
      courseId: 'hsi-cpr-aed',
      label: 'CPR/AED Certification',
      partnerName: 'Health & Safety Institute',
      credentialIssued: 'AHA BLS / Heartsaver CPR/AED',
      duration: '4 hours',
      required: true,
      enrollmentUrl: 'https://www.hsi.com/courses/cpr-aed',
    },
    {
      courseId: 'hsi-first-aid',
      label: 'First Aid Certification',
      partnerName: 'Health & Safety Institute',
      credentialIssued: 'AHA Heartsaver First Aid',
      duration: '4 hours',
      required: true,
      enrollmentUrl: 'https://www.hsi.com/courses/first-aid',
    },
  ],

  faqs: [
    {
      question: 'How does the at-home training work?',
      answer:
        'After you enroll, a training mannequin is shipped directly to your door. You join a live instructor-led session online and complete your hands-on skills practice at home using the mannequin.',
    },
    {
      question: 'Do I have to return the mannequin?',
      answer:
        'Yes. A prepaid return label is included in your shipment. Return the mannequin within 7 days of completing your course.',
    },
    {
      question: 'How long is the certification valid?',
      answer: 'CPR/First Aid certifications are valid for 2 years from the date of issue.',
    },
    {
      question: 'Do I get a card the same day?',
      answer:
        'Yes. You receive your digital HSI certification card on the same day you complete the course.',
    },
    {
      question: 'Is this the healthcare-level CPR?',
      answer:
        'Yes. This course is delivered through Health & Safety Institute (HSI) and meets the CPR standard required by hospitals, clinics, nursing facilities, and most healthcare employers. HSI certifications are nationally recognized and accepted by employers across healthcare, construction, and childcare.',
    },
    {
      question: 'What if I already have a mannequin?',
      answer:
        'Contact us before enrolling and we can adjust your order so you are not charged for shipping.',
    },
  ],
  breadcrumbs: [
    { label: 'Home', href: '/' },
    { label: 'Programs', href: '/programs' },
    { label: 'CPR & First Aid' },
  ],
  metaTitle: 'CPR & First Aid Certification | HSI | Train From Home | $130 | Elevate',
  metaDescription:
    'Get CPR & First Aid certified from home. Live instructor. Training mannequin shipped to your door. $130. HSI certification — accepted by healthcare, construction, and childcare employers. Enroll today.',


  funding: {
    wioa_eligible: false,
    fssa_eligible: false,
    wrg_eligible: false,
    jobReadyIndyEligible: false,
    fundingNotes: 'Short certification. Not typically funded through WIOA or FSSA as a standalone credential. May be bundled with a funded program.',
  },
};
