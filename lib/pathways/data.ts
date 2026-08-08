import { RAPIDS_CONFIG } from '@/lib/compliance/rapids-config';

export type PathwayFunding =
  | 'WIOA Adult/DW'
  | 'WIOA Youth'
  | 'WRG'
  | 'JRI'
  | 'State Grant'
  | 'Employer-Sponsored'
  | 'Self-Pay';
export type PathwayFormat = 'Hybrid' | 'In-Person' | 'Online';
export type PathwayIndustry =
  | 'Healthcare'
  | 'Skilled Trades'
  | 'Transportation'
  | 'Cosmetology'
  | 'Technology';

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

const BARBER = RAPIDS_CONFIG.programs.barber;

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
    credentialIssuer: 'Indiana Department of Health',
    ctaHref: '/programs/cna',
    stages: [
      { stage: 1, title: 'Eligibility Screening', description: 'Complete applicable intake, workforce-agency, and funding eligibility steps.', duration: 'Varies' },
      { stage: 2, title: 'Classroom & Clinical Training', description: 'Complete assigned classroom, skills-lab, and clinical requirements.', duration: 'Program schedule' },
      { stage: 3, title: 'Certification Exam', description: 'Complete the current Indiana CNA testing requirements.', duration: 'Exam schedule' },
      { stage: 4, title: 'Career Services', description: 'Use resume, interview, and employer-connection support.' },
      { stage: 5, title: 'Advancement', description: 'Continue into stackable healthcare credentials where appropriate.' },
    ],
  },
  {
    slug: BARBER.slug,
    title: BARBER.name,
    industry: 'Cosmetology',
    format: 'Hybrid',
    funding: ['State Grant', 'Employer-Sponsored', 'Self-Pay'],
    duration: `Approximately ${Math.ceil(BARBER.totalHours / 40)} OJL weeks at 40 hours/week, plus ${BARBER.relatedInstructionHours} RTI hours`,
    location: 'Approved participating host shop',
    outcomes: ['Registered Barber Apprentice', 'Registered Apprenticeship Program Completer', 'Indiana Barber License pathway'],
    credential: 'Registered Apprenticeship Certificate of Completion / Indiana Barber License pathway',
    credentialIssuer: 'U.S. Department of Labor / Indiana Professional Licensing Agency',
    ctaHref: '/programs/barber-apprenticeship',
    stages: [
      {
        stage: 1,
        title: 'Application & Intake',
        description: 'Complete apprentice enrollment, required documentation, and host-shop placement/onboarding.',
        duration: 'Varies by placement and documentation',
      },
      {
        stage: 2,
        title: 'On-the-Job Learning',
        description: `Complete ${BARBER.totalHours.toLocaleString()} approved supervised OJL hours at an approved host shop while completing ${BARBER.relatedInstructionHours} hours of Related Technical Instruction through the assigned LMS coursework.`,
        duration: `Approximately ${Math.ceil(BARBER.totalHours / 40)} OJL weeks at the standard 40-hour schedule`,
      },
      {
        stage: 3,
        title: 'Program Completion',
        description: 'Complete registered competencies, OJL, RTI, and required completion documentation.',
        duration: 'After all requirements are satisfied',
      },
      {
        stage: 4,
        title: 'Indiana Licensing Process',
        description: 'Submit the current Indiana licensing application and complete the examination or other requirements applicable at the time of application.',
        duration: 'State processing/exam schedule',
      },
      {
        stage: 5,
        title: 'Career Advancement',
        description: 'Continue as a licensed barber, advance in shop operations, or pursue business ownership subject to applicable licensing requirements.',
      },
    ],
  },
  {
    slug: 'hvac',
    title: 'HVAC Technician',
    industry: 'Skilled Trades',
    format: 'Hybrid',
    funding: ['WIOA Adult/DW', 'WRG', 'Employer-Sponsored'],
    duration: 'See current program schedule',
    location: 'Indianapolis, IN',
    outcomes: ['HVAC Installer', 'Maintenance Technician', 'Refrigeration Technician'],
    credential: 'EPA 608 pathway and program credentials',
    credentialIssuer: 'Applicable credentialing bodies',
    ctaHref: '/programs/hvac-technician',
    stages: [
      { stage: 1, title: 'Eligibility Screening', description: 'Complete applicable intake and funding eligibility steps.', duration: 'Varies' },
      { stage: 2, title: 'Technical Training', description: 'Complete assigned HVAC safety, systems, tools, installation, maintenance, and diagnostic training.', duration: 'Program schedule' },
      { stage: 3, title: 'Credential Testing', description: 'Complete the credential examinations assigned to the current program.', duration: 'Testing schedule' },
      { stage: 4, title: 'Employer Placement', description: 'Use employer-connection and career-services support.' },
      { stage: 5, title: 'Advancement', description: 'Pursue advanced HVAC and skilled-trades credentials as appropriate.' },
    ],
  },
  {
    slug: 'cdl',
    title: 'CDL Commercial Driving',
    industry: 'Transportation',
    format: 'In-Person',
    funding: ['WIOA Adult/DW', 'WRG', 'Self-Pay'],
    duration: 'See current program schedule',
    location: 'Indiana',
    outcomes: ['Commercial Driver', 'Local/Regional Driver', 'Transportation Career Pathway'],
    credential: 'CDL Class A or Class B pathway',
    credentialIssuer: 'Indiana Bureau of Motor Vehicles',
    ctaHref: '/programs/cdl-training',
    stages: [
      { stage: 1, title: 'Eligibility & Entry Requirements', description: 'Complete program, DOT, funding, and permit requirements that apply.', duration: 'Varies' },
      { stage: 2, title: 'Classroom & Behind-the-Wheel', description: 'Complete assigned theory, range, and supervised road training.', duration: 'Program schedule' },
      { stage: 3, title: 'Skills Test', description: 'Complete the applicable Indiana CDL testing requirements.', duration: 'Testing schedule' },
      { stage: 4, title: 'Employer Placement', description: 'Use transportation-employer and career-services connections.' },
      { stage: 5, title: 'Advancement', description: 'Pursue endorsements and advanced transportation roles as appropriate.' },
    ],
  },
  {
    slug: 'it-help-desk',
    title: 'IT Help Desk',
    industry: 'Technology',
    format: 'In-Person',
    funding: ['WIOA Adult/DW', 'JRI', 'Self-Pay'],
    duration: 'See current program schedule',
    location: 'Indianapolis Training Center',
    outcomes: ['IT Support Specialist', 'Help Desk Technician'],
    credential: 'Assigned IT credential pathway',
    credentialIssuer: 'Applicable credentialing body',
    ctaHref: '/programs/it-help-desk',
    stages: [
      { stage: 1, title: 'Eligibility Screening', description: 'Complete admissions and applicable funding steps.', duration: 'Varies' },
      { stage: 2, title: 'Technical Training', description: 'Complete assigned hardware, software, operating-system, networking, and support coursework.', duration: 'Program schedule' },
      { stage: 3, title: 'Credential Exam', description: 'Complete the credential exam assigned to the current program.', duration: 'Testing schedule' },
      { stage: 4, title: 'Job Placement', description: 'Use resume, interview, and employer-connection support.' },
      { stage: 5, title: 'Advancement', description: 'Continue into networking, security, cloud, or other stackable IT pathways.' },
    ],
  },
  {
    slug: 'cybersecurity-analyst',
    title: 'Cybersecurity Analyst',
    industry: 'Technology',
    format: 'In-Person',
    funding: ['WIOA Adult/DW', 'JRI', 'Self-Pay'],
    duration: 'See current program schedule',
    location: 'Indianapolis Training Center',
    outcomes: ['Cybersecurity Analyst', 'Security Operations Role'],
    credential: 'Assigned cybersecurity credential pathway',
    credentialIssuer: 'Applicable credentialing body',
    ctaHref: '/programs/cybersecurity-analyst',
    stages: [
      { stage: 1, title: 'Eligibility Screening', description: 'Complete admissions and applicable funding steps.', duration: 'Varies' },
      { stage: 2, title: 'Security Training', description: 'Complete assigned security, threat, vulnerability, incident-response, and compliance coursework.', duration: 'Program schedule' },
      { stage: 3, title: 'Credential Exam', description: 'Complete the credential exam assigned to the current program.', duration: 'Testing schedule' },
      { stage: 4, title: 'Job Placement', description: 'Use resume, interview, and employer-connection support.' },
      { stage: 5, title: 'Advancement', description: 'Continue into more advanced cybersecurity roles and credentials.' },
    ],
  },
  {
    slug: 'welding',
    title: 'Welding',
    industry: 'Skilled Trades',
    format: 'In-Person',
    funding: ['WIOA Adult/DW', 'WRG', 'Employer-Sponsored'],
    duration: 'See current program schedule',
    location: 'Indianapolis, IN',
    outcomes: ['Welder', 'Fabricator', 'Manufacturing/Construction Pathway'],
    credential: 'Assigned welding/safety credential pathway',
    credentialIssuer: 'Applicable credentialing bodies',
    ctaHref: '/programs/welding',
    stages: [
      { stage: 1, title: 'Eligibility Screening', description: 'Complete admissions and applicable funding steps.', duration: 'Varies' },
      { stage: 2, title: 'Welding Training', description: 'Complete assigned safety, welding-process, blueprint, fabrication, and shop training.', duration: 'Program schedule' },
      { stage: 3, title: 'Credential Assessment', description: 'Complete assigned program credential assessments.', duration: 'Testing schedule' },
      { stage: 4, title: 'Employer Placement', description: 'Use employer-connection and career-services support.' },
      { stage: 5, title: 'Advancement', description: 'Pursue advanced welding processes and credentials as appropriate.' },
    ],
  },
  {
    slug: 'electrical',
    title: 'Electrical',
    industry: 'Skilled Trades',
    format: 'Hybrid',
    funding: ['WIOA Adult/DW', 'WRG', 'Employer-Sponsored'],
    duration: 'See current program schedule',
    location: 'Indianapolis, IN',
    outcomes: ['Electrical Helper', 'Electrical Apprentice', 'Maintenance Electrical Pathway'],
    credential: 'Assigned electrical/safety credential pathway',
    credentialIssuer: 'Applicable credentialing bodies',
    ctaHref: '/programs/electrical',
    stages: [
      { stage: 1, title: 'Eligibility Screening', description: 'Complete admissions and applicable funding steps.', duration: 'Varies' },
      { stage: 2, title: 'Electrical Training', description: 'Complete assigned theory, code, wiring, conduit, troubleshooting, and safety training.', duration: 'Program schedule' },
      { stage: 3, title: 'Credential Assessment', description: 'Complete assigned program credential assessments.', duration: 'Testing schedule' },
      { stage: 4, title: 'Employer Placement', description: 'Use employer-connection and career-services support.' },
      { stage: 5, title: 'Advancement', description: 'Continue into registered apprenticeship or advanced electrical pathways as appropriate.' },
    ],
  },
];
