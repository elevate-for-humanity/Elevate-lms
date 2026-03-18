import type { ProgramSchema } from '@/lib/programs/program-schema';

export const CYBERSECURITY_ANALYST: ProgramSchema = {
  slug: 'cybersecurity-analyst',
  title: 'Cybersecurity Analyst',
  subtitle: 'Protect networks and data from cyber threats. Prepare for CompTIA Security+ in 12 weeks.',
  sector: 'technology',
  category: 'Cybersecurity',

  heroImage: '/images/pages/cybersecurity-screen.jpg',
  heroImageAlt: 'Cybersecurity student analyzing network security',
  videoSrc: '/videos/it-technology.mp4',

  deliveryMode: 'hybrid',
  durationWeeks: 12,
  hoursPerWeekMin: 18,
  hoursPerWeekMax: 22,
  hoursBreakdown: {
    onlineInstruction: 110,
    handsOnLab: 70,
    examPrep: 30,
    careerPlacement: 10,
  },
  schedule: 'Mon–Fri, 18–22 hours per week (flexible scheduling)',
  eveningSchedule: 'Evening cohorts available for working adults.',
  cohortSize: '10–14 participants per cohort',
  fundingStatement: 'WIOA and Next Level Jobs funding available for eligible Indiana residents. You must qualify — eligibility is not guaranteed. Self-pay options available.',
  selfPayCost: '$4,200',
  badge: '5-Star Top Job — DWD',
  badgeColor: 'purple',

  credentials: [
    { name: 'CompTIA Security+', issuer: 'CompTIA', description: 'Industry-standard certification for cybersecurity professionals. Required for DoD 8570 compliance.', validity: '3 years' },
    { name: 'CompTIA Network+', issuer: 'CompTIA', description: 'Validates networking skills required for security analysis and infrastructure defense.', validity: '3 years' },
    { name: 'CompTIA IT Fundamentals (ITF+)', issuer: 'CompTIA', description: 'Foundational IT literacy covering hardware, software, networking, and security basics.', validity: 'Lifetime' },
    { name: 'OSHA 10 General Industry', issuer: 'OSHA', description: 'Workplace safety certification for general industry environments.', validity: 'Recommended renewal every 5 years' },
    { name: 'CPR/AED/First Aid', issuer: 'American Heart Association', description: 'Emergency response certification for workplace safety.', validity: '2 years' },
  ],

  outcomes: [
    { statement: 'Identify and classify common attack vectors including phishing, malware, and social engineering', assessedAt: 'Week 3' },
    { statement: 'Configure firewalls, IDS/IPS, and endpoint protection systems', assessedAt: 'Week 5' },
    { statement: 'Perform vulnerability scans and interpret results using industry tools', assessedAt: 'Week 7' },
    { statement: 'Implement identity and access management controls (MFA, RBAC, least privilege)', assessedAt: 'Week 8' },
    { statement: 'Respond to security incidents following NIST incident response framework', assessedAt: 'Week 10' },
    { statement: 'Apply encryption and PKI concepts to secure data in transit and at rest', assessedAt: 'Week 9' },
  ],

  careerPathway: [
    { title: 'Security Operations Analyst', timeframe: '0–6 months', requirements: 'CompTIA Security+', salaryRange: '$55,000–$70,000' },
    { title: 'Information Security Analyst', timeframe: '1–2 years', requirements: 'Security+ + 1 year experience', salaryRange: '$70,000–$90,000' },
    { title: 'Penetration Tester', timeframe: '2–4 years', requirements: 'CompTIA PenTest+ or CEH', salaryRange: '$85,000–$120,000' },
    { title: 'Security Engineer / Architect', timeframe: '5+ years', requirements: 'CISSP or CISM', salaryRange: '$110,000–$150,000' },
  ],

  weeklySchedule: [
    { week: 'Week 1', title: 'IT & Networking Foundations', competencyMilestone: 'Describe the OSI model and TCP/IP stack' },
    { week: 'Week 2', title: 'Network Infrastructure', competencyMilestone: 'Configure routers, switches, and VLANs in a lab environment' },
    { week: 'Week 3', title: 'Threats & Vulnerabilities', competencyMilestone: 'Classify attack types and threat actors' },
    { week: 'Week 4', title: 'Cryptography & PKI', competencyMilestone: 'Implement symmetric and asymmetric encryption' },
    { week: 'Week 5', title: 'Network Security', competencyMilestone: 'Configure firewall rules and IDS/IPS policies' },
    { week: 'Week 6', title: 'Identity & Access Management', competencyMilestone: 'Implement MFA, RBAC, and least-privilege access' },
    { week: 'Week 7', title: 'Vulnerability Management', competencyMilestone: 'Run vulnerability scans and prioritize remediation' },
    { week: 'Week 8', title: 'Security Operations', competencyMilestone: 'Monitor SIEM dashboards and triage alerts' },
    { week: 'Week 9', title: 'Compliance & Governance', competencyMilestone: 'Map controls to NIST, PCI-DSS, and HIPAA frameworks' },
    { week: 'Week 10', title: 'Incident Response', competencyMilestone: 'Execute a tabletop incident response exercise' },
    { week: 'Week 11', title: 'Exam Prep & Practice Labs', competencyMilestone: 'Pass Security+ practice exams with 85%+ score' },
    { week: 'Week 12', title: 'Certification & Career Placement', competencyMilestone: 'Sit for CompTIA Security+ exam and complete career portfolio' },
  ],

  curriculum: [
    { title: 'Networking Fundamentals', topics: ['OSI model and TCP/IP', 'Routing and switching', 'DNS, DHCP, and network services', 'Wireless networking and security'] },
    { title: 'Threats, Attacks & Vulnerabilities', topics: ['Malware types and indicators', 'Social engineering techniques', 'Application and web-based attacks', 'Threat intelligence sources'] },
    { title: 'Cryptography', topics: ['Symmetric vs asymmetric encryption', 'Hashing algorithms', 'PKI and certificate management', 'TLS/SSL implementation'] },
    { title: 'Security Architecture', topics: ['Firewalls and IDS/IPS', 'Network segmentation', 'Cloud security concepts', 'Zero trust architecture'] },
    { title: 'Security Operations', topics: ['SIEM tools and log analysis', 'Vulnerability scanning (Nessus, OpenVAS)', 'Incident response procedures', 'Digital forensics basics'] },
    { title: 'Governance, Risk & Compliance', topics: ['NIST Cybersecurity Framework', 'PCI-DSS and HIPAA requirements', 'Risk assessment methodology', 'Security policies and procedures'] },
  ],

  complianceAlignment: [
    { standard: 'CompTIA Security+ SY0-701', description: 'Curriculum aligned to current CompTIA Security+ exam objectives.' },
    { standard: 'NIST Cybersecurity Framework', description: 'Program maps to NIST CSF Identify, Protect, Detect, Respond, and Recover functions.' },
    { standard: 'DoD 8570 / 8140', description: 'CompTIA Security+ satisfies DoD baseline certification for IAT Level II positions.' },
    { standard: 'WIOA Title I', description: 'Program meets WIOA eligibility for Individual Training Accounts (ITA).' },
  ],

  trainingPhases: [
    {
      phase: 1,
      title: 'Networking Foundations',
      weeks: 'Weeks 1–3',
      focus: 'OSI model, TCP/IP, routing, switching, and network infrastructure.',
      labCompetencies: [
        'Configure routers and switches in a virtual lab',
        'Capture and analyze packets using Wireshark',
        'Set up VLANs and verify inter-VLAN routing',
        'Troubleshoot connectivity using CLI tools',
      ],
    },
    {
      phase: 2,
      title: 'Threats, Attacks & Defense',
      weeks: 'Weeks 4–7',
      focus: 'Attack vectors, cryptography, firewalls, IDS/IPS, and identity management.',
      labCompetencies: [
        'Configure firewall rules to block specific traffic patterns',
        'Set up and tune an IDS/IPS (Snort or Suricata)',
        'Implement MFA and role-based access controls',
        'Perform a vulnerability scan using Nessus or OpenVAS',
        'Identify phishing emails in a simulated inbox (95% accuracy)',
      ],
    },
    {
      phase: 3,
      title: 'Security+ Certification Prep',
      weeks: 'Weeks 8–10',
      focus: 'CompTIA Security+ SY0-701 exam domains, practice tests, and incident response.',
      labCompetencies: [
        'Score 85%+ on Security+ practice exams',
        'Execute a tabletop incident response exercise',
        'Map security controls to NIST CSF functions',
        'Analyze SIEM alerts and triage by severity',
      ],
    },
    {
      phase: 4,
      title: 'Capstone & Career Placement',
      weeks: 'Weeks 11–12',
      focus: 'Security assessment capstone project, certification exam, and employer placement.',
      labCompetencies: [
        'Complete a network security assessment report',
        'Present findings and remediation recommendations',
        'Sit for CompTIA Security+ certification exam',
        'Complete a mock SOC analyst interview',
      ],
    },
  ],

  credentialPipeline: [
    {
      training: 'Security+ prep (Weeks 4–11)',
      certification: 'CompTIA Security+ Certification',
      certBody: 'CompTIA',
      jobRole: 'Security Operations Analyst',
    },
    {
      training: 'Network+ prep (Weeks 1–3)',
      certification: 'CompTIA Network+ Certification',
      certBody: 'CompTIA',
      jobRole: 'Network Security Technician',
    },
    {
      training: 'Security+ (DoD 8570 baseline)',
      certification: 'DoD IAT Level II Compliance',
      certBody: 'U.S. Department of Defense',
      jobRole: 'Government / Defense IT Security',
    },
  ],

  laborMarket: {
    medianSalary: 112000,
    salaryRange: '$55,000–$150,000',
    growthRate: '32% (much faster than average)',
    source: 'U.S. Bureau of Labor Statistics',
    sourceYear: 2024,
    region: 'Indianapolis-Carmel-Anderson MSA',
  },

  careers: [
    { title: 'Security Operations Analyst', salary: '$55,000–$70,000' },
    { title: 'Information Security Analyst', salary: '$70,000–$90,000' },
    { title: 'Penetration Tester', salary: '$85,000–$120,000' },
    { title: 'Security Engineer', salary: '$100,000–$140,000' },
  ],

  cta: {
    applyHref: '/apply',
    requestInfoHref: '/programs/cybersecurity-analyst/request-info',
    careerConnectHref: 'https://www.indianacareerconnect.com/jobs/search?q=cybersecurity+analyst&location=Indiana',
    advisorHref: '/contact',
    courseHref: '/programs/cybersecurity-analyst',
  },

  admissionRequirements: [
    '18 years or older',
    'High school diploma or GED',
    'Basic computer and networking literacy (CompTIA A+ recommended but not required)',
    'Background check may be required by employer partners',
  ],
  equipmentIncluded: 'Laptop loaner, virtual lab environment, all training materials, and certification exam vouchers included',
  modality: 'Hybrid — Online instruction via LMS, hands-on labs using virtual cyber range',
  facilityInfo: 'Elevate training center, Indianapolis',
  bilingualSupport: 'Bilingual (English/Spanish) instruction available.',
  employerPartners: ['Resultant', 'Anthem (Elevance Health)', 'Roche Diagnostics IT', 'Indiana National Guard Cyber'],
  pricingIncludes: [
    'CompTIA Security+ exam voucher',
    'CompTIA Network+ exam voucher',
    'CompTIA ITF+ exam voucher',
    'OSHA 10 certification',
    'CPR/AED/First Aid certification',
    'Virtual cyber range lab access',
    'Laptop loaner for duration of program',
    'Career placement support',
  ],
  paymentTerms: 'Self-pay: $4,200 with payment plans. WIOA and Next Level Jobs funding available for eligible Indiana residents — eligibility not guaranteed.',

  faqs: [
    { question: 'Do I need prior cybersecurity experience?', answer: 'No. We start with networking fundamentals and build to Security+ level. CompTIA A+ is recommended but not required.' },
    { question: 'What is CompTIA Security+?', answer: 'CompTIA Security+ is the most widely held cybersecurity certification. It is required for DoD positions and recognized by employers across all industries.' },
    { question: 'Is this program eligible for funding?', answer: 'Yes. This program is eligible for WIOA and Next Level Jobs funding. Qualified participants pay $0 out-of-pocket.' },
    { question: 'What is the job outlook for cybersecurity?', answer: 'The BLS projects 32% growth for information security analysts through 2032 — much faster than average. There are over 750,000 unfilled cybersecurity positions in the U.S.' },
  ],

  breadcrumbs: [
    { label: 'Home', href: '/' },
    { label: 'Programs', href: '/programs' },
    { label: 'Cybersecurity Analyst' },
  ],

  metaTitle: 'Cybersecurity Analyst | CompTIA Security+ | Indianapolis',
  metaDescription: 'Prepare for CompTIA Security+ and Network+ certifications. 12-week program. Cybersecurity analysts earn $112,000/year. Indianapolis. WIOA funding available for eligible Indiana residents.',
};
