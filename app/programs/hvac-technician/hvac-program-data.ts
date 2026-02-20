import {
  Thermometer, Zap, Wind, Wrench, Shield, BookOpen,
  ClipboardCheck, Users,
} from 'lucide-react';

export const QUICK_STATS = [
  { val: '20 Weeks', label: 'Program Duration' },
  { val: '6', label: 'Credentials Earned' },
  { val: '$5,000', label: 'Total Cost' },
  { val: '$45K-$75K', label: 'Starting Salary Range' },
];

export const COMPETENCIES = [
  'Heating system installation and repair',
  'Cooling system diagnostics and service',
  'Refrigerant handling and EPA compliance',
  'Electrical wiring, controls, and components',
  'Ductwork design, installation, and balancing',
  'Thermostat and control system programming',
  'OSHA 30 safety compliance',
  'Residential system sizing and load calculations',
  'Preventive maintenance procedures',
  'Troubleshooting and diagnostics',
  'Customer service and communication',
  'Tool and equipment operation',
  'Building code compliance',
  'Energy efficiency and green HVAC practices',
  'Professional conduct and workplace readiness',
];

// Exact match to INTraining Program ID #10004322 credential listing + EPA 608
export const CREDENTIALS = [
  { name: 'Residential HVAC Certification 1', type: 'Industry-Recognized Certification' as const, issuer: 'Licensed credential partner', testRequired: true, obtainedInProgram: true },
  { name: 'Residential HVAC Certification 2 - Refrigeration Diagnostics', type: 'Industry-Recognized Certification' as const, issuer: 'Licensed credential partner', testRequired: true, obtainedInProgram: true },
  { name: 'EPA 608 Universal Certification', type: 'Industry-Recognized Certification' as const, issuer: 'EPA / Licensed testing center', testRequired: true, obtainedInProgram: true },
  { name: 'OSHA 30', type: 'Industry-Recognized Certification' as const, issuer: 'OSHA / CareerSafe', testRequired: true, obtainedInProgram: true },
  { name: 'CPR', type: 'Industry-Recognized Certification' as const, issuer: 'Licensed credential partner', testRequired: true, obtainedInProgram: true },
  { name: 'Rise Up', type: 'Certificate' as const, issuer: 'Licensed credential partner', testRequired: true, obtainedInProgram: true },
];

export const CURRICULUM = [
  { icon: Thermometer, title: 'HVAC Fundamentals', description: 'Heating, cooling, and ventilation system theory. Residential and light commercial system types, components, and operating principles.' },
  { icon: Zap, title: 'Electrical Systems', description: 'Wiring, controls, electrical components, circuit analysis, and safety. Hands-on work with real HVAC electrical systems.' },
  { icon: Wind, title: 'Air Distribution', description: 'Ductwork design, installation, balancing, and airflow measurement. Residential system sizing and load calculations.' },
  { icon: Wrench, title: 'Refrigeration', description: 'Refrigerant handling, recovery, and recycling. EPA 608 certification preparation. Refrigeration diagnostics and repair.' },
  { icon: Shield, title: 'Safety & Codes', description: 'OSHA 30 certification. Building codes, permits, safety protocols, PPE, and hazard identification for HVAC work.' },
  { icon: BookOpen, title: 'Troubleshooting & Diagnostics', description: 'Systematic diagnostic procedures, meter usage, pressure testing, and repair techniques for common HVAC failures.' },
];

export const CAREERS = [
  { title: 'HVAC Installer', salary: '$40K-$55K', demand: 'High demand' },
  { title: 'Service Technician', salary: '$45K-$65K', demand: 'Very high demand' },
  { title: 'Refrigeration Tech', salary: '$50K-$70K', demand: 'Specialized' },
  { title: 'Commercial HVAC', salary: '$55K-$80K', demand: 'Premium pay' },
];

export const EMPLOYERS = [
  'Carrier', 'Trane', 'Lennox', 'Local contractors',
  'Property management', 'Hospitals', 'Schools', 'Manufacturing',
];

export const ENROLLMENT_STEPS = [
  { title: 'Complete Intake', description: 'Submit the funding and eligibility intake form online. We check WIOA, Workforce Ready Grant, and other funding sources on your behalf.' },
  { title: 'Register at Indiana Career Connect', description: 'Create your account at indianacareerconnect.com. This is required for WIOA and Workforce Ready Grant eligibility verification.' },
  { title: 'Attend Orientation', description: 'Meet your instructors, tour the training facility, review the program schedule, and complete enrollment paperwork.' },
  { title: 'Start Training', description: 'Begin your 20-week HVAC program with hands-on instruction, classroom learning, and certification preparation.' },
];

export type AiTutorGuide = {
  id: string;
  name: string;
  role: 'AI Tutor' | 'AI Guide' | 'AI Coach';
  availability: string;
  specialties: string[];
  features: string[];
};

export type CredentialedPartnerEntry = {
  id: string;
  name: string;
  credentialSummary: string;
  areas: string[];
  verificationNote?: string;
  websiteUrl?: string;
};

export type HvacProgramInstructorsBlock = {
  heading: string;
  subheading: string;
  aiTutors: AiTutorGuide[];
  credentialedPartners: CredentialedPartnerEntry[];
};

export const hvacInstructorsBlock: HvacProgramInstructorsBlock = {
  heading: 'AI Tutors & Credentialed Partners',
  subheading:
    '24/7 AI support for learners, paired with credentialed partners who deliver instruction and verification.',
  aiTutors: [
    {
      id: 'tutor-core',
      name: 'Elevate AI Tutor',
      role: 'AI Tutor',
      availability: '24/7',
      specialties: [
        'EPA 608 prep',
        'Troubleshooting workflows',
        'Electrical fundamentals',
        'Refrigeration cycle',
        'Study plans',
      ],
      features: [
        'Explains concepts step-by-step',
        'Generates practice questions',
        'Flags weak areas and recommends lessons',
        'Supports role-based coaching (student/case manager)',
      ],
    },
    {
      id: 'guide-onboarding',
      name: 'Onboarding Guide',
      role: 'AI Guide',
      availability: '24/7',
      specialties: ['Enrollment steps', 'Document checklist', 'Orientation help', 'Next actions'],
      features: [
        'Keeps students moving through onboarding',
        'Answers "what do I do next?" questions',
        'Escalation prompts when stuck',
      ],
    },
  ],
  credentialedPartners: [
    {
      id: 'partner-hvac-lab',
      name: 'Licensed HVAC Training Provider',
      credentialSummary:
        'EPA-certified, state-licensed facility delivering hands-on lab instruction and competency validation for workforce eligibility.',
      areas: ['Hands-on labs', 'EPA 608 prep', 'Residential HVAC Cert 1 & 2', 'Equipment training'],
      verificationNote:
        'Partner verification and credential documentation available to admins and workforce boards upon request.',
    },
    {
      id: 'partner-careersafe',
      name: 'CareerSafe',
      credentialSummary:
        'OSHA-authorized outreach trainer delivering construction safety certification.',
      areas: ['OSHA 30-Hour Construction Safety'],
      websiteUrl: 'https://www.careersafeonline.com',
    },
    {
      id: 'partner-elevate',
      name: 'Elevate for Humanity',
      credentialSummary:
        'USDOL Registered Sponsor, ETPL-listed (INTraining #10004322). Program oversight, funding coordination, and career placement.',
      areas: ['Enrollment management', 'WIOA/WRG funding', 'Progress reporting', 'Career placement'],
    },
  ],
};

export const HVAC_FAQS = [
  { q: 'What schedule does the program follow?', a: 'The 20-week program runs Monday through Friday. Exact hours depend on your cohort and training location. You\'ll receive your schedule during orientation.' },
  { q: 'Is this program fully online?', a: 'No. This is a hybrid program. Theory and some coursework are delivered through the LMS (online), but hands-on lab training and certification exams are in-person at the training facility.' },
  { q: 'What if I need to miss a day?', a: 'Attendance is tracked and reported. If you need to miss a day, notify your instructor in advance. Excessive absences may affect your enrollment status and funding eligibility.' },
  { q: 'Do I need to buy tools?', a: 'Basic tools are provided during training. You may want to invest in your own tool set before entering the workforce. An HVAC tool kit is available in our student store.' },
  { q: 'What happens after I complete the program?', a: 'You\'ll have 6 industry credentials and documented competencies. Our career services team helps with resume building, interview prep, and employer connections. Many graduates are placed within 30 days.' },
  { q: 'Can I work while enrolled?', a: 'Yes, but the program is full-time. Many students work evenings or weekends. Talk to your advisor about scheduling if you have work obligations.' },
  { q: 'What is the refund policy?', a: 'Funded students (WIOA/WRG) have no out-of-pocket cost. Self-pay students can review the refund policy in the enrollment agreement provided during onboarding.' },
  { q: 'Is there a language requirement?', a: 'Instruction is in English. You should be comfortable reading technical manuals and following verbal instructions in English. ESL support resources are available.' },
];

export const ELIGIBILITY = [
  'At least 18 years old with a valid government-issued ID',
  'High school diploma or GED',
  'Valid driver\'s license (HVAC work involves traveling to job sites)',
  'Ability to lift 50+ pounds and work in confined spaces',
  'Basic math skills (fractions, measurements, calculations)',
  'Pass background check',
];
