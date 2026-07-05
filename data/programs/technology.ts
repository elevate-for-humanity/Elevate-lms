import type { ProgramSchema } from '@/lib/programs/program-schema';

export const TECHNOLOGY: ProgramSchema = {
  slug: 'technology',
  title: 'Technology Career Training',
  subtitle:
    'Launch a tech career with industry-recognized certifications in IT support, cybersecurity, networking, and software development.',
  sector: 'technology',
  category: 'Information Technology',
  programType: 'workforce',
  heroImage: '/images/pages/technology-sector.webp',
  heroImageAlt: 'Technology student working on a computer',
  deliveryMode: 'hybrid',
  deliveredBy: 'Elevate',
  durationWeeks: 12,
  hoursPerWeekMin: 15,
  hoursPerWeekMax: 20,
  hoursBreakdown: { onlineInstruction: 80, handsOnLab: 60, examPrep: 20, careerPlacement: 20 },
  schedule: 'Flexible — evenings and weekends available',
  cohortSize: '10–15 participants per cohort',
  fundingStatement:
    'WIOA and Workforce Ready Grant funding available for eligible Indiana residents. Self-pay options available.',
  selfPayCost: '$3,500',
  fundingOptions: ['wioa', 'wrg', 'impact', 'self_pay'],
  badge: 'High Demand',
  badgeColor: 'blue',
  credentials: [
    {
      name: 'CompTIA IT Fundamentals (ITF+)',
      issuer: 'CompTIA',
      description:
        'Entry-level IT certification covering hardware, software, networking, and security basics.',
      validity: 'Lifetime',
    },
    {
      name: 'CompTIA A+',
      issuer: 'CompTIA',
      description: 'Industry-standard certification for IT support technicians.',
      validity: 'Lifetime',
    },
  ],
  outcomes: [
    {
      statement: 'Troubleshoot hardware and software issues on Windows and macOS',
      assessedAt: 'Week 6',
    },
    {
      statement: 'Configure basic network settings and resolve connectivity issues',
      assessedAt: 'Week 8',
    },
    { statement: 'Identify and respond to common cybersecurity threats', assessedAt: 'Week 10' },
    { statement: 'Pass CompTIA A+ Core 1 and Core 2 exams', assessedAt: 'Week 12' },
    { statement: 'Set up and manage user accounts, permissions, and security policies', assessedAt: 'Week 7' },
  ],
  careerPathway: [
    {
      title: 'IT Help Desk Technician',
      timeframe: '0–6 months',
      requirements: 'CompTIA A+',
      salaryRange: '$35,000–$48,000',
    },
    {
      title: 'Systems Administrator',
      timeframe: '1–3 years',
      requirements: 'A+ + experience',
      salaryRange: '$50,000–$70,000',
    },
    {
      title: 'Network Engineer',
      timeframe: '3–5 years',
      requirements: 'Network+ or CCNA',
      salaryRange: '$65,000–$90,000',
    },
    {
      title: 'Cybersecurity Analyst',
      timeframe: '3–5 years',
      requirements: 'Security+',
      salaryRange: '$70,000–$100,000',
    },
  ],
  weeklySchedule: [
    {
      week: 'Week 1–3',
      title: 'IT Fundamentals',
      competencyMilestone: 'Identify hardware components and install an operating system',
    },
    {
      week: 'Week 4–6',
      title: 'Hardware & Troubleshooting',
      competencyMilestone: 'Diagnose and repair common hardware failures',
    },
    {
      week: 'Week 7–9',
      title: 'Networking & Security',
      competencyMilestone: 'Configure a basic network and identify security threats',
    },
    {
      week: 'Week 10–12',
      title: 'Exam Prep & Career Launch',
      competencyMilestone: 'Pass CompTIA A+ Core 1 and Core 2 practice exams',
    },
  ],
  curriculum: [
    {
      title: 'IT Fundamentals',
      topics: [
        'Hardware components',
        'Operating systems',
        'Software installation',
        'File management',
        'Basic troubleshooting',
      ],
    },
    {
      title: 'Hardware & Support',
      topics: [
        'PC assembly and disassembly',
        'Printer and peripheral setup',
        'Mobile device support',
        'Virtualization basics',
        'Help desk procedures',
      ],
    },
    {
      title: 'Networking',
      topics: [
        'TCP/IP fundamentals',
        'Network configuration',
        'Wi-Fi setup',
        'VPN basics',
        'Network troubleshooting',
      ],
    },
    {
      title: 'Security & Compliance',
      topics: [
        'Threat identification',
        'Malware removal',
        'Password policies',
        'Data backup',
        'Incident response basics',
      ],
    },
  ],
  complianceAlignment: [
    {
      standard: 'WIOA Title I',
      description: 'Program meets WIOA eligibility for short-term training.',
    },
    {
      standard: 'Indiana INDemand Jobs',
      description: 'IT support is a high-demand occupation in Indiana.',
    },
    {
      standard: 'CompTIA Authorized Partner',
      description: 'Exam prep aligned to CompTIA A+ objectives.',
    },
  ],
  trainingPhases: [
    {
      phase: 1,
      title: 'Foundations',
      weeks: 'Weeks 1–3',
      focus: 'IT fundamentals and hardware.',
      labCompetencies: [
        'Identify hardware components',
        'Install Windows OS',
        'Navigate command line',
      ],
    },
    {
      phase: 2,
      title: 'Support & Networking',
      weeks: 'Weeks 4–9',
      focus: 'Troubleshooting, networking, and security.',
      labCompetencies: ['Diagnose hardware failure', 'Configure network adapter', 'Remove malware'],
    },
    {
      phase: 3,
      title: 'Certification & Career',
      weeks: 'Weeks 10–12',
      focus: 'CompTIA A+ exam prep and job placement.',
      labCompetencies: [
        'Pass A+ Core 1 practice exam',
        'Pass A+ Core 2 practice exam',
        'Complete mock technical interview',
      ],
    },
  ],
  credentialPipeline: [
    {
      training: 'Technology Career Training (12 weeks)',
      certification: 'CompTIA A+',
      certBody: 'CompTIA',
      jobRole: 'IT Help Desk / Support Technician',
    },
  ],
  laborMarket: {
    medianSalary: 57910,
    salaryRange: '$35,000–$100,000',
    growthRate: '8% (faster than average)',
    source: 'U.S. Bureau of Labor Statistics',
    sourceYear: 2024,
    region: 'Indianapolis-Carmel-Anderson MSA',
  },
  careers: [
    { title: 'IT Help Desk Technician', salary: '$35,000–$48,000' },
    { title: 'Systems Administrator', salary: '$50,000–$70,000' },
    { title: 'Network Engineer', salary: '$65,000–$90,000' },
    { title: 'Cybersecurity Analyst', salary: '$70,000–$100,000' },
  ],
  cta: {
    applyHref: '/apply?program=technology',
    requestInfoHref: '/contact?program=technology',
    careerConnectHref:
      'https://www.indianacareerconnect.com/jobs/search?q=IT+support&location=Indiana',
    advisorHref: '/contact',
    courseHref: '/programs/technology',
  },
  admissionRequirements: [
    '18 years or older',
    'Valid government-issued ID',
    'Basic computer literacy',
    'High school diploma or GED preferred',
  ],
  equipmentIncluded: 'All training materials and CompTIA exam vouchers included',
  modality: 'Hybrid — Online coursework via LMS, hands-on labs at Elevate training center',
  facilityInfo: 'Elevate training center, Indianapolis',
  employerPartners: [
    'Indianapolis-area IT firms',
    'Managed service providers',
    'Corporate IT departments',
  ],
  pricingIncludes: [
    '180 instructional hours',
    'CompTIA A+ exam vouchers (Core 1 + Core 2)',
    'All training materials',
    'Career placement support',
  ],
  paymentTerms:
    'WIOA and Workforce Ready Grant funding available for eligible Indiana residents. Self-pay: $3,500.',
  faqs: [
    {
      question: 'Do I need prior IT experience?',
      answer: 'No. This program starts from the basics and builds to CompTIA A+ certification.',
    },
    {
      question: 'Are exam fees included?',
      answer: 'Yes. CompTIA A+ Core 1 and Core 2 exam vouchers are included in your tuition.',
    },
    {
      question: 'What jobs can I get after completing this program?',
      answer:
        'IT help desk technician, desktop support specialist, systems administrator, and more.',
    },
  ],
  breadcrumbs: [
    { label: 'Home', href: '/' },
    { label: 'Programs', href: '/programs' },
    { label: 'Technology Career Training' },
  ],
  metaTitle: 'Technology Career Training | CompTIA A+ | Indianapolis | Elevate for Humanity',
  metaDescription:
    '12-week technology training program in Indianapolis. Earn CompTIA A+ certification. WIOA and Workforce Ready Grant funding available for eligible Indiana residents.',


  funding: {
    wioa_eligible: true,
    fssa_eligible: true,
    wrg_eligible: true,
    jobReadyIndyEligible: true,
    fundingNotes: 'Indiana ETPL-listed. WIOA Title I and WRG funding available for eligible Indiana residents.',
  },
};
