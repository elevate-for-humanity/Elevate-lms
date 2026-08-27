import { getRegisteredProgramStandard } from '@/lib/apprenticeship/registered-program-contract';
import { PROGRAMS } from '@/lib/programs/canonical-data';

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

const REGISTERED_BARBER = getRegisteredProgramStandard('barber-apprenticeship');
if (!REGISTERED_BARBER) throw new Error('REGISTERED_BARBER_STANDARD_MISSING');
const BARBER = PROGRAMS['barber-apprenticeship'];
if (!BARBER) throw new Error('CANONICAL_BARBER_PROGRAM_MISSING');

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
    duration: BARBER.durationRange,
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
        title: 'Competency-Based Apprenticeship',
        description: `Complete supervised work/OJL evidence, all ${REGISTERED_BARBER.completion.competencyCount} registered competency requirements, and ${REGISTERED_BARBER.completion.requiredRtiHours} verified hours of Related Technical Instruction through assigned coursework. Work/OJL hours are auditable evidence and are not a fixed DOL completion denominator.`,
        duration: 'Varies by verified competency progression, RTI completion, approved work schedule, and host-shop placement',
      },
      {
        stage: 3,
        title: 'Registered Program Completion',
        description: 'Complete registered competencies, verified RTI, supervised-work evidence, wage progression requirements, and required completion documentation under the approved standard.',
        duration: 'After all registered-program requirements are satisfied',
      },
      {
        stage: 4,
        title: 'Indiana Licensing Process',
        description: `Track the separate Indiana licensing requirement of ${BARBER.totalHours.toLocaleString()} hours and complete the state examination or other requirements applicable at the time of application.`,
        duration: 'State licensing and processing schedule',
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
      { stage: 2, title: 'Technical Training', description: 'Complete assigned security, networking, systems, incident-response, and defensive-operations coursework.', duration: 'Program schedule' },
      { stage: 3, title: 'Credential Exam', description: 'Complete the credential exam assigned to the current program.', duration: 'Testing schedule' },
      { stage: 4, title: 'Job Placement', description: 'Use resume, interview, and employer-connection support.' },
      { stage: 5, title: 'Advancement', description: 'Continue into advanced security, cloud, network, or governance pathways.' },
    ],
  },
];
