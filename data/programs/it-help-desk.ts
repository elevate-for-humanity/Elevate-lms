import type { ProgramSchema } from '@/lib/programs/program-schema';

export const IT_HELP_DESK: ProgramSchema = {
  slug: 'it-help-desk',
  title: 'IT Help Desk Technician',
  subtitle: 'Troubleshoot hardware, software, and networks. Earn CompTIA A+ in 8 weeks and launch your IT career.',
  sector: 'technology',
  category: 'Information Technology',

  heroImage: '/images/pages/comp-universal-hero.jpg',
  heroImageAlt: 'IT help desk technician troubleshooting a workstation',

  deliveryMode: 'hybrid',
  durationWeeks: 8,
  hoursPerWeekMin: 18,
  hoursPerWeekMax: 22,
  hoursBreakdown: {
    onlineInstruction: 80,
    handsOnLab: 50,
    examPrep: 20,
    careerPlacement: 10,
  },
  schedule: 'Mon–Fri, 18–22 hours per week (flexible scheduling)',
  eveningSchedule: 'Evening cohorts available. Contact us for schedule options.',
  cohortSize: '12–16 participants per cohort',
  fundingStatement: 'WIOA and Next Level Jobs funding available for eligible Indiana residents. You must qualify — eligibility is not guaranteed. Self-pay options available.',
  selfPayCost: '$2,800',
  badge: '4-Star Top Job — DWD',
  badgeColor: 'blue',

  credentials: [
    { name: 'CompTIA A+ (Core 1)', issuer: 'CompTIA', description: 'Validates hardware, networking, and troubleshooting skills for entry-level IT support.', validity: '3 years' },
    { name: 'CompTIA A+ (Core 2)', issuer: 'CompTIA', description: 'Validates operating systems, security, and operational procedures for IT support.', validity: '3 years' },
    { name: 'CompTIA IT Fundamentals (ITF+)', issuer: 'CompTIA', description: 'Foundational IT literacy covering hardware, software, networking, and security basics.', validity: 'Lifetime' },
    { name: 'OSHA 10 General Industry', issuer: 'OSHA', description: 'Workplace safety certification for general industry environments.', validity: 'Recommended renewal every 5 years' },
    { name: 'CPR/AED/First Aid', issuer: 'American Heart Association', description: 'Emergency response certification for workplace safety.', validity: '2 years' },
  ],

  outcomes: [
    { statement: 'Install and configure Windows, macOS, and Linux operating systems', assessedAt: 'Week 2' },
    { statement: 'Diagnose and resolve hardware failures using structured troubleshooting methodology', assessedAt: 'Week 3' },
    { statement: 'Configure TCP/IP, DNS, DHCP, and basic network services', assessedAt: 'Week 4' },
    { statement: 'Implement endpoint security including antivirus, firewall, and access controls', assessedAt: 'Week 5' },
    { statement: 'Manage user accounts and permissions in Active Directory', assessedAt: 'Week 6' },
    { statement: 'Document incidents and resolutions using ticketing systems', assessedAt: 'Week 7' },
  ],

  careerPathway: [
    { title: 'Help Desk Technician', timeframe: '0–6 months', requirements: 'CompTIA A+', salaryRange: '$38,000–$48,000' },
    { title: 'Desktop Support Specialist', timeframe: '6–18 months', requirements: 'A+ + 6 months experience', salaryRange: '$45,000–$55,000' },
    { title: 'Systems Administrator', timeframe: '2–3 years', requirements: 'CompTIA Network+ or Server+', salaryRange: '$55,000–$75,000' },
    { title: 'IT Manager', timeframe: '4–6 years', requirements: 'CompTIA Project+ or PMP', salaryRange: '$75,000–$100,000' },
  ],

  weeklySchedule: [
    { week: 'Week 1', title: 'IT Foundations & Hardware', competencyMilestone: 'Identify PC components and assemble a workstation' },
    { week: 'Week 2', title: 'Operating Systems', competencyMilestone: 'Install and configure Windows, macOS, and Linux' },
    { week: 'Week 3', title: 'Hardware Troubleshooting', competencyMilestone: 'Diagnose and replace failed components' },
    { week: 'Week 4', title: 'Networking Fundamentals', competencyMilestone: 'Configure TCP/IP and basic network services' },
    { week: 'Week 5', title: 'Security Fundamentals', competencyMilestone: 'Implement endpoint security and access controls' },
    { week: 'Week 6', title: 'Active Directory & User Management', competencyMilestone: 'Create and manage user accounts and group policies' },
    { week: 'Week 7', title: 'Ticketing & Documentation', competencyMilestone: 'Log, escalate, and resolve incidents using a ticketing system' },
    { week: 'Week 8', title: 'Exam Prep & Career Placement', competencyMilestone: 'Pass CompTIA A+ practice exams with 85%+ score' },
  ],

  curriculum: [
    { title: 'PC Hardware & Assembly', topics: ['Motherboards, CPUs, RAM, storage', 'Power supplies and peripherals', 'BIOS/UEFI configuration', 'Component compatibility'] },
    { title: 'Operating Systems', topics: ['Windows 10/11 installation and configuration', 'macOS and Linux basics', 'Command-line tools (CMD, PowerShell, Terminal)', 'OS troubleshooting'] },
    { title: 'Networking', topics: ['TCP/IP, DNS, DHCP', 'Wireless networking', 'Network troubleshooting tools', 'VPN and remote access'] },
    { title: 'Security', topics: ['Malware identification and removal', 'Firewall and antivirus configuration', 'Physical security and social engineering', 'Data backup and recovery'] },
    { title: 'Help Desk Operations', topics: ['Ticketing systems (ServiceNow, Jira)', 'SLA management', 'Customer communication', 'Escalation procedures'] },
  ],

  complianceAlignment: [
    { standard: 'CompTIA A+ CE (220-1101 / 220-1102)', description: 'Exam objectives aligned to current CompTIA A+ certification requirements.' },
    { standard: 'WIOA Title I', description: 'Program meets WIOA eligibility for Individual Training Accounts (ITA).' },
    { standard: 'Indiana DWD Next Level Jobs', description: 'Approved for Workforce Ready Grant and Employer Training Grant funding.' },
  ],

  trainingPhases: [
    {
      phase: 1,
      title: 'IT Foundations',
      weeks: 'Weeks 1–2',
      focus: 'PC hardware, operating systems, and basic troubleshooting methodology.',
      labCompetencies: [
        'Assemble a PC from components and boot to OS',
        'Install Windows, macOS, and Linux on bare hardware',
        'Navigate command line (CMD, PowerShell, Terminal)',
        'Identify and replace failed RAM, HDD/SSD, and PSU',
      ],
    },
    {
      phase: 2,
      title: 'Networking & Security',
      weeks: 'Weeks 3–5',
      focus: 'TCP/IP, network services, endpoint security, and Active Directory.',
      labCompetencies: [
        'Configure a static IP address and verify connectivity',
        'Set up DNS and DHCP on a lab network',
        'Configure Windows Firewall rules and antivirus policies',
        'Create user accounts and group policies in Active Directory',
        'Troubleshoot network connectivity using ping, tracert, and nslookup',
      ],
    },
    {
      phase: 3,
      title: 'CompTIA A+ Exam Prep',
      weeks: 'Weeks 6–7',
      focus: 'CompTIA A+ Core 1 and Core 2 exam domains, practice tests, and performance-based questions.',
      labCompetencies: [
        'Score 85%+ on CompTIA A+ Core 1 practice exam',
        'Score 85%+ on CompTIA A+ Core 2 practice exam',
        'Complete 3 performance-based question simulations',
      ],
    },
    {
      phase: 4,
      title: 'Help Desk Operations & Career Placement',
      weeks: 'Week 8',
      focus: 'Ticketing systems, SLA management, customer communication, and job placement.',
      labCompetencies: [
        'Log, categorize, and resolve 10 simulated tickets in a ticketing system',
        'Demonstrate professional phone and email communication',
        'Complete a mock technical interview',
      ],
    },
  ],

  credentialPipeline: [
    {
      training: 'CompTIA A+ prep (Weeks 1–7)',
      certification: 'CompTIA A+ Certification',
      certBody: 'CompTIA',
      jobRole: 'Help Desk Technician / Desktop Support',
    },
    {
      training: 'IT Fundamentals module (Week 1)',
      certification: 'CompTIA ITF+ Certification',
      certBody: 'CompTIA',
      jobRole: 'Entry-level IT Support',
    },
    {
      training: 'OSHA 10 General Industry (Week 1)',
      certification: 'OSHA 10 DOL Card',
      certBody: 'U.S. Department of Labor',
      jobRole: 'IT Field Technician',
    },
  ],

  laborMarket: {
    medianSalary: 55510,
    salaryRange: '$38,000–$72,000',
    growthRate: '6% (faster than average)',
    source: 'U.S. Bureau of Labor Statistics',
    sourceYear: 2024,
    region: 'Indianapolis-Carmel-Anderson MSA',
  },

  careers: [
    { title: 'Help Desk Technician', salary: '$38,000–$48,000' },
    { title: 'Desktop Support Specialist', salary: '$45,000–$55,000' },
    { title: 'Field Service Technician', salary: '$42,000–$58,000' },
    { title: 'IT Support Analyst', salary: '$50,000–$65,000' },
  ],

  cta: {
    applyHref: '/apply',
    advisorHref: '/contact',
    courseHref: '/programs/it-help-desk',
  },

  admissionRequirements: [
    '18 years or older',
    'High school diploma or GED (or actively pursuing)',
    'Basic computer literacy',
    'No prior IT experience required',
  ],
  equipmentIncluded: 'Laptop loaner, lab access, all training materials, and certification exam vouchers included',
  modality: 'Hybrid — Online instruction via LMS, hands-on labs at training facility',
  facilityInfo: 'Elevate training center, Indianapolis',
  bilingualSupport: 'Bilingual (English/Spanish) instruction available.',
  employerPartners: ['Resultant', 'KAR Global', 'Roche Diagnostics', 'Indiana University Health IT'],
  pricingIncludes: [
    'CompTIA A+ exam vouchers (Core 1 + Core 2)',
    'CompTIA ITF+ exam voucher',
    'OSHA 10 certification',
    'CPR/AED/First Aid certification',
    'Laptop loaner for duration of program',
    'Career placement support',
  ],
  paymentTerms: 'Self-pay: $2,800 with payment plans. WIOA and Next Level Jobs funding available for eligible Indiana residents — eligibility not guaranteed.',

  faqs: [
    { question: 'Do I need prior IT experience?', answer: 'No. This program starts from the fundamentals and builds to certification-level competency.' },
    { question: 'What is CompTIA A+?', answer: 'CompTIA A+ is the industry-standard certification for entry-level IT support. It is recognized by employers worldwide and required for many help desk positions.' },
    { question: 'Is funding available?', answer: 'Yes. This program is eligible for WIOA and Next Level Jobs funding. Qualified participants pay $0 out-of-pocket.' },
    { question: 'What jobs can I get after completing this program?', answer: 'Graduates typically start as help desk technicians, desktop support specialists, or field service technicians earning $38,000–$55,000/year.' },
  ],

  breadcrumbs: [
    { label: 'Home', href: '/' },
    { label: 'Programs', href: '/programs' },
    { label: 'IT Help Desk Technician' },
  ],

  metaTitle: 'IT Help Desk Technician | CompTIA A+ | Indianapolis',
  metaDescription: 'Earn CompTIA A+ and IT Specialist certifications. 8-week program. Help desk technicians earn $55,510/year in Indiana. WIOA funding available.',
};
