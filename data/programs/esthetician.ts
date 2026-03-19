import type { ProgramSchema } from '@/lib/programs/program-schema';

export const ESTHETICIAN: ProgramSchema = {
  slug: 'esthetician',
  title: 'Professional Esthetician & Client Services',
  subtitle: '5-week accelerated non-licensure certificate. Skin analysis, facial treatments, hair removal, and business startup — WIOA funded.',
  sector: 'personal-services',
  category: 'Beauty & Personal Services',
  heroImage: '/images/pages/barber-apprentice-learning.jpg',
  heroImageAlt: 'Esthetician performing professional facial treatment',
  videoSrc: '/videos/esthetician-spa.mp4',
  deliveryMode: 'hybrid',
  durationWeeks: 5,
  hoursPerWeekMin: 20,
  hoursPerWeekMax: 25,
  hoursBreakdown: { onlineInstruction: 30, handsOnLab: 55, examPrep: 8, careerPlacement: 7 },
  schedule: 'Monthly enrollment — flexible hybrid scheduling',
  cohortSize: '8–12 participants per cohort',
  fundingStatement: '$0 with WIOA or Workforce Ready Grant. Self-pay: $4,575.',
  selfPayCost: '$4,575',
  badge: 'ETPL Approved',
  badgeColor: 'green',

  credentials: [
    { name: 'Business of Retail Certified Specialist', issuer: 'National Retail Federation (NRF)', description: 'Nationally recognized retail business certification validating customer service and business operations skills.', validity: 'Lifetime' },
    { name: 'Customer Service & Sales Certified Specialist', issuer: 'National Retail Federation (NRF)', description: 'NRF certification for client-facing service professionals.', validity: 'Lifetime' },
    { name: 'OSHA 10-Hour Safety Certification', issuer: 'CareerSafe', description: 'OSHA-authorized workplace safety training for salon and spa environments.', validity: 'Lifetime' },
  ],

  outcomes: [
    { statement: 'Perform a complete facial treatment including cleansing, exfoliation, and hydration', assessedAt: 'Week 2' },
    { statement: 'Conduct a professional skin analysis and recommend appropriate treatments', assessedAt: 'Week 2' },
    { statement: 'Apply infection control and sanitation protocols in a spa setting', assessedAt: 'Week 1' },
    { statement: 'Demonstrate brow shaping and basic hair removal techniques', assessedAt: 'Week 3' },
    { statement: 'Pass the NRF Business of Retail and Customer Service assessments', assessedAt: 'Week 5' },
  ],

  careerPathway: [
    { title: 'Esthetician (Non-Licensure)', timeframe: '0–3 months', requirements: 'Program completion + NRF credentials', salaryRange: '$28,000–$42,000' },
    { title: 'Licensed Esthetician', timeframe: '6–12 months', requirements: 'State licensure (600 hours)', salaryRange: '$35,000–$55,000' },
    { title: 'Spa Manager / Lead Esthetician', timeframe: '2–4 years', requirements: 'License + experience', salaryRange: '$45,000–$65,000' },
    { title: 'Independent Beauty Business Owner', timeframe: '1–3 years', requirements: 'License + business plan', salaryRange: '$40,000–$80,000+' },
  ],

  weeklySchedule: [
    { week: 'Week 1', title: 'Skin Science & Sanitation', competencyMilestone: 'Identify skin types and apply sanitation protocols correctly' },
    { week: 'Week 2', title: 'Facial Treatments & Skin Analysis', competencyMilestone: 'Perform a complete facial treatment on a live model' },
    { week: 'Week 3', title: 'Hair Removal & Advanced Techniques', competencyMilestone: 'Demonstrate brow shaping and waxing technique' },
    { week: 'Week 4', title: 'Client Services & Business Operations', competencyMilestone: 'Complete NRF Customer Service practice assessment with 80%+' },
    { week: 'Week 5', title: 'Certification & Career Readiness', competencyMilestone: 'Pass NRF Business of Retail and Customer Service exams' },
  ],

  curriculum: [
    { title: 'Skin Science & Analysis', topics: ['Skin anatomy and physiology', 'Skin type identification', 'Common skin conditions', 'Product knowledge and ingredients', 'Contraindications and safety'] },
    { title: 'Facial Treatments', topics: ['Cleansing and exfoliation techniques', 'Facial massage and lymphatic drainage', 'Mask application and removal', 'Hydration and moisturizing treatments', 'Makeup fundamentals'] },
    { title: 'Hair Removal', topics: ['Brow shaping and design', 'Waxing techniques (face and body)', 'Threading basics', 'Post-treatment care', 'Client consultation for hair removal'] },
    { title: 'Client Services & Business', topics: ['Client consultation and intake', 'Service menu development', 'Pricing and retail sales', 'Appointment management', 'Digital marketing for beauty professionals'] },
    { title: 'Safety, Sanitation & Compliance', topics: ['OSHA 10 workplace safety', 'Infection control in spa settings', 'Chemical safety and MSDS', 'State board awareness (non-licensure context)', 'Client documentation and consent forms'] },
  ],

  complianceAlignment: [
    { standard: 'ETPL Program ID #10004628', description: 'Approved on Indiana ETPL for WIOA Individual Training Account funding.' },
    { standard: 'NRF Foundation Certification Standards', description: 'Curriculum aligned to NRF Business of Retail and Customer Service exam objectives.' },
    { standard: 'CIP Code 12.0409', description: 'Aesthetician/Esthetician and Skin Care Specialist classification.' },
    { standard: 'WIOA Title I', description: 'Program meets WIOA eligibility requirements for workforce funding.' },
  ],

  laborMarket: { medianSalary: 38790, salaryRange: '$28,000–$65,000', growthRate: '9% (faster than average)', source: 'U.S. Bureau of Labor Statistics', sourceYear: 2024, region: 'Indiana' },

  careers: [
    { title: 'Esthetician (Non-Licensure Certificate)', salary: '$28,000–$42,000' },
    { title: 'Licensed Esthetician', salary: '$35,000–$55,000' },
    { title: 'Spa Manager', salary: '$45,000–$65,000' },
    { title: 'Independent Beauty Business Owner', salary: '$40,000–$80,000+' },
  ],

  cta: {
    applyHref: '/apply?program=esthetician',
    requestInfoHref: '/programs/esthetician/request-info',
    advisorHref: '/contact',
  },

  // ─── Content model ──────────────────────────────────────────────
  deliveryModel: 'partner',
  partnerCourses: [
    {
      courseId: 'milady-esthetics',
      label: 'Milady Standard Esthetics',
      partnerName: 'Milady/Cengage',
      credentialIssued: 'Esthetics Certificate',
      duration: 'Integrated across 5 weeks',
      required: true,
      enrollmentUrl: 'https://www.milady.com/esthetics',
    },
  ],
  microCourses: [
    {
      courseId: 'careersafe-osha10-general',
      label: 'OSHA 10-Hour General Industry',
      partnerName: 'CareerSafe',
      credentialIssued: 'OSHA 10-Hour Card',
      duration: '10 hours',
      required: true,
      enrollmentUrl: 'https://www.careersafeonline.com/osha-10-hour-general-industry',
    },
    {
      courseId: 'hsi-cpr-aed',
      label: 'CPR/AED Certification',
      partnerName: 'Health & Safety Institute',
      credentialIssued: 'CPR/AED Certificate',
      duration: '4 hours',
      required: false,
      enrollmentUrl: 'https://www.hsi.com/courses/cpr-aed',
    },
  ],

  admissionRequirements: ['16 years or older', 'No prior esthetics experience required', 'High school diploma or GED preferred'],
  equipmentIncluded: 'Facial tools, waxing supplies, and all course materials provided. Students keep their starter kit.',
  modality: 'Hybrid — theory-based online modules plus hands-on practical training.',
  facilityInfo: 'Elevate training center, Indianapolis. Monthly enrollment opportunities.',
  employerPartners: ['Day spas and medical spas', 'Salons and beauty studios', 'Hotels and resorts', 'Mobile beauty service operators'],
  pricingIncludes: ['All course materials and starter kit', 'NRF exam fees (Business of Retail + Customer Service)', 'OSHA 10 certification', 'Career placement support'],
  paymentTerms: 'WIOA and Workforce Ready Grant accepted. Self-pay: $4,575 with payment plans available.',

  faqs: [
    { question: 'Do I need a state license after this program?', answer: 'This is a non-licensure certificate program. You can work in many spa and salon settings without a state license. If you want to work in a licensed facility or open your own business, you can pursue the Indiana Esthetician License (600 hours) as a next step.' },
    { question: 'What is the NRF credential?', answer: 'The National Retail Federation Foundation offers nationally recognized certifications in business and customer service. These credentials are valued by employers in retail, beauty, and service industries.' },
    { question: 'Is this program WIOA-funded?', answer: 'Yes. This program is ETPL-approved (Program ID #10004628) and eligible for WIOA Individual Training Accounts. Contact your local WorkOne office to apply.' },
  ],

  breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Programs', href: '/programs' }, { label: 'Professional Esthetician' }],
  metaTitle: 'Professional Esthetician & Client Services | ETPL Approved | Indianapolis',
  metaDescription: 'Earn NRF and OSHA 10 certifications in 5 weeks. WIOA-funded esthetician and skincare training in Indianapolis. Non-licensure certificate program.',
};
