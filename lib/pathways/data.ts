export type PathwayFunding = 'WIOA Adult/DW' | 'WIOA Youth' | 'WRG' | 'JRI' | 'State Grant' | 'Employer-Sponsored' | 'Self-Pay';
export type PathwayFormat = 'Hybrid' | 'In-Person' | 'Online';
export type PathwayIndustry = 'Healthcare' | 'Skilled Trades' | 'Transportation' | 'Cosmetology' | 'Technology';

export type PathwayStage = {
  stage: number;
  title: string;
  description: string;
  duration?: string;
};

export type Pathway = {
  slug: string;
  title: string;
  industry: PathwayIndustry;
  format: PathwayFormat;
  funding: PathwayFunding[];
  duration: string;
  location: string;
  outcomes: string[];
  credential: string;
  credentialIssuer: string;
  ctaHref: string;
  stages: PathwayStage[];
};

export const PATHWAYS: Pathway[] = [
  {
    slug: 'cna',
    title: 'Certified Nursing Assistant (CNA)',
    industry: 'Healthcare',
    format: 'Hybrid',
    funding: ['WIOA Adult/DW', 'WIOA Youth', 'JRI', 'Self-Pay'],
    duration: '4–6 weeks',
    location: 'Indianapolis, IN',
    outcomes: ['Certified Nursing Assistant', 'Patient Care Technician'],
    credential: 'CNA Certification',
    credentialIssuer: 'Indiana State Dept. of Health (ISDH)',
    ctaHref: '/programs/cna',
    stages: [
      { stage: 1, title: 'Eligibility Screening', description: 'Indiana Career Connect registration, WorkOne appointment, WIOA/JRI eligibility determination.', duration: '1–2 weeks' },
      { stage: 2, title: 'Classroom & Clinical Training', description: 'Patient care fundamentals, vital signs, infection control, mobility techniques, medical terminology. Clinical rotation at a healthcare facility.', duration: '4–6 weeks' },
      { stage: 3, title: 'State CNA Exam', description: 'Indiana CNA certification exam (written + skills). Issued by Indiana ISDH.', duration: 'Exam day' },
      { stage: 4, title: 'Job Placement', description: 'Resume building, interview prep, and direct referrals to hospitals, nursing homes, and home health agencies in Central Indiana.' },
      { stage: 5, title: 'Advancement', description: 'Credential stacking: CNA → Medical Assistant → LPN → RN pathway. Continued LMS access for upskilling.' },
    ],
  },
  {
    slug: 'barber-apprenticeship',
    title: 'Barber Apprenticeship',
    industry: 'Cosmetology',
    format: 'In-Person',
    funding: ['State Grant', 'Employer-Sponsored', 'Self-Pay'],
    duration: '~18 months (1,500 OJT hours)',
    location: 'Indianapolis, IN',
    outcomes: ['Registered Barber Apprentice', 'Licensed Barber', 'Shop Owner'],
    credential: 'Indiana Barber License',
    credentialIssuer: 'Indiana Professional Licensing Agency (PLA) / USDOL RAPIDS',
    ctaHref: '/programs/barber-apprenticeship',
    stages: [
      { stage: 1, title: 'Application & Intake', description: 'Apprentice application, background check, shop placement matching. Elevate handles USDOL and RAPIDS registration.', duration: '1–2 weeks' },
      { stage: 2, title: 'On-the-Job Training', description: '1,500 hours of supervised training at a host barbershop. Apprentices are paid during training. Classroom instruction hours included.', duration: '~18 months' },
      { stage: 3, title: 'State Board Exam', description: 'Indiana PLA barber exam. Exam prep materials and practice tests provided.', duration: 'Exam day' },
      { stage: 4, title: 'Licensure & Employment', description: 'Indiana barber license issued. Work independently, join a shop, or open your own business.' },
      { stage: 5, title: 'Advancement', description: 'Shop ownership pathway, instructor certification, cosmetology cross-licensing.' },
    ],
  },
  {
    slug: 'hvac',
    title: 'HVAC Technician',
    industry: 'Skilled Trades',
    format: 'Hybrid',
    funding: ['WIOA Adult/DW', 'WRG', 'Employer-Sponsored'],
    duration: '8–16 weeks',
    location: 'Indianapolis, IN',
    outcomes: ['HVAC Installer', 'Maintenance Technician', 'Refrigeration Tech'],
    credential: 'EPA 608 Certification + OSHA 10',
    credentialIssuer: 'EPA / OSHA',
    ctaHref: '/programs/hvac',
    stages: [
      { stage: 1, title: 'Eligibility Screening', description: 'Indiana Career Connect registration, WorkOne appointment, WIOA/WRG eligibility.', duration: '1–2 weeks' },
      { stage: 2, title: 'Technical Training', description: 'Safety protocols, OSHA standards, tool operation, blueprint reading, code compliance, troubleshooting, and diagnostics.', duration: '8–16 weeks' },
      { stage: 3, title: 'Certification Exams', description: 'EPA 608 (Universal) for refrigerant handling. OSHA 10-hour safety certification.', duration: '1–2 days' },
      { stage: 4, title: 'Employer Placement', description: 'Direct connections to HVAC contractors, property management companies, and commercial maintenance employers.' },
      { stage: 5, title: 'Advancement', description: 'OSHA 30, NATE certification, journeyman electrician pathway, HVAC contractor license.' },
    ],
  },
  {
    slug: 'cdl',
    title: 'CDL Commercial Driving',
    industry: 'Transportation',
    format: 'In-Person',
    funding: ['WIOA Adult/DW', 'WRG', 'Self-Pay'],
    duration: '4–6 weeks (160+ hours)',
    location: 'Indianapolis, IN',
    outcomes: ['OTR Driver ($50K+ first year)', 'Local Delivery Driver', 'Bus Operator'],
    credential: 'CDL Class A or Class B',
    credentialIssuer: 'Indiana BMV',
    ctaHref: '/programs/cdl',
    stages: [
      { stage: 1, title: 'Eligibility Screening', description: 'Indiana Career Connect registration, WorkOne appointment, WIOA eligibility, DOT physical and drug screen.', duration: '1–2 weeks' },
      { stage: 2, title: 'Classroom & Behind-the-Wheel', description: '160+ hours of classroom instruction and supervised road driving. Pre-trip inspection, backing maneuvers, road skills.', duration: '4–6 weeks' },
      { stage: 3, title: 'BMV Skills Test', description: 'Indiana BMV CDL skills test (pre-trip, basic controls, road test). Class A or Class B.', duration: 'Test day' },
      { stage: 4, title: 'Employer Placement', description: 'Direct connections to trucking companies, logistics firms, and transit agencies. Many employers offer sign-on bonuses.' },
      { stage: 5, title: 'Advancement', description: 'Hazmat endorsement, tanker endorsement, owner-operator pathway, fleet management.' },
    ],
  },
  {
    slug: 'it-help-desk',
    title: 'IT Help Desk',
    industry: 'Technology',
    format: 'In-Person',
    funding: ['WIOA Adult/DW', 'JRI', 'Self-Pay'],
    duration: '8 weeks',
    location: 'Indianapolis Training Center',
    outcomes: ['IT Support Specialist ($40K–$85K)', 'Help Desk Technician'],
    credential: 'Certiport IT Specialist — Device Configuration',
    credentialIssuer: 'Certiport',
    ctaHref: '/programs/it-help-desk',
    stages: [
      { stage: 1, title: 'Eligibility Screening', description: 'Indiana Career Connect registration, WIOA/JRI eligibility determination.', duration: '1–2 weeks' },
      { stage: 2, title: 'Technical Training', description: 'Hardware/software troubleshooting, network configuration, operating systems (Windows, Linux, macOS), cloud computing basics.', duration: '8 weeks' },
      { stage: 3, title: 'Certiport Exam', description: 'Certiport IT Specialist — Device Configuration & Management exam on-site. Practice tests included.', duration: '1 day' },
      { stage: 4, title: 'Job Placement', description: 'Resume building, interview prep, and connections to IT service providers, tech companies, and enterprise help desks.' },
      { stage: 5, title: 'Advancement', description: 'IT Specialist — Networking → Cybersecurity pathway. Network admin, cybersecurity analyst roles.' },
    ],
  },
  {
    slug: 'cybersecurity-analyst',
    title: 'Cybersecurity Analyst',
    industry: 'Technology',
    format: 'In-Person',
    funding: ['WIOA Adult/DW', 'JRI', 'Self-Pay'],
    duration: '12 weeks',
    location: 'Indianapolis Training Center',
    outcomes: ['Cybersecurity Analyst', 'Security Operations Center Analyst'],
    credential: 'Certiport IT Specialist — Cybersecurity',
    credentialIssuer: 'Certiport',
    ctaHref: '/programs/cybersecurity-analyst',
    stages: [
      { stage: 1, title: 'Eligibility Screening', description: 'Indiana Career Connect registration, WIOA/JRI eligibility.', duration: '1–2 weeks' },
      { stage: 2, title: 'Security Training', description: 'Network security, threat analysis, vulnerability assessment, incident response, cryptography, compliance frameworks.', duration: '12 weeks' },
      { stage: 3, title: 'Certiport Exam', description: 'Certiport IT Specialist — Cybersecurity exam on-site. Practice tests included.', duration: '1 day' },
      { stage: 4, title: 'Job Placement', description: 'Connections to cybersecurity firms, managed security service providers, and enterprise security teams.' },
      { stage: 5, title: 'Advancement', description: 'Advanced cybersecurity roles: penetration tester, security architect, CISO pathway.' },
    ],
  },
  {
    slug: 'welding',
    title: 'Welding',
    industry: 'Skilled Trades',
    format: 'In-Person',
    funding: ['WIOA Adult/DW', 'WRG', 'Employer-Sponsored'],
    duration: '8–12 weeks',
    location: 'Indianapolis, IN',
    outcomes: ['Welder', 'Fabricator', 'Pipe Fitter'],
    credential: 'OSHA 10 + AWS Welding Certification',
    credentialIssuer: 'OSHA / AWS',
    ctaHref: '/programs/welding',
    stages: [
      { stage: 1, title: 'Eligibility Screening', description: 'Indiana Career Connect registration, WorkOne appointment, WIOA/WRG eligibility.', duration: '1–2 weeks' },
      { stage: 2, title: 'Welding Training', description: 'MIG, TIG, stick welding. Blueprint reading, safety protocols, metal fabrication, and shop professionalism.', duration: '8–12 weeks' },
      { stage: 3, title: 'Certification', description: 'OSHA 10-hour safety. AWS welding certification testing.', duration: '1–2 days' },
      { stage: 4, title: 'Employer Placement', description: 'Connections to manufacturing plants, construction firms, and fabrication shops.' },
      { stage: 5, title: 'Advancement', description: 'AWS advanced certifications, pipe welding specialization, welding inspector pathway.' },
    ],
  },
  {
    slug: 'electrical',
    title: 'Electrical',
    industry: 'Skilled Trades',
    format: 'Hybrid',
    funding: ['WIOA Adult/DW', 'WRG', 'Employer-Sponsored'],
    duration: '8–16 weeks',
    location: 'Indianapolis, IN',
    outcomes: ['Electrician Helper', 'Electrical Apprentice', 'Maintenance Electrician'],
    credential: 'OSHA 10 + NCCER Electrical Level 1',
    credentialIssuer: 'OSHA / NCCER',
    ctaHref: '/programs/electrical',
    stages: [
      { stage: 1, title: 'Eligibility Screening', description: 'Indiana Career Connect registration, WorkOne appointment, WIOA/WRG eligibility.', duration: '1–2 weeks' },
      { stage: 2, title: 'Electrical Training', description: 'Electrical theory, NEC code, residential/commercial wiring, conduit bending, troubleshooting, safety protocols.', duration: '8–16 weeks' },
      { stage: 3, title: 'Certification', description: 'OSHA 10-hour safety. NCCER Electrical Level 1 assessment.', duration: '1–2 days' },
      { stage: 4, title: 'Employer Placement', description: 'Connections to electrical contractors, construction companies, and property management firms.' },
      { stage: 5, title: 'Advancement', description: 'Electrical apprenticeship (4-year), journeyman license, master electrician, contractor license.' },
    ],
  },
];
