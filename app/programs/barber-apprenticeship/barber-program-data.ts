

export const SITE_URL = 'https://www.elevateforhumanity.org';

export const QUICK_STATS = [
  { val: '2,000', label: 'OJT Hours' },
  { val: '15 Months', label: 'Program Duration' },
  { val: '$4,890', label: 'Total Cost' },
  { val: '3', label: 'Credentials Earned' },
];

export const COMPETENCIES = [
  // Sanitation & Safety
  'Tool disinfection procedures',
  'Workstation sanitation standards',
  'PPE and hygiene practices',
  'Chemical handling and safety',
  // Technical Barbering
  'Clipper handling and guard usage',
  'Fading and blending techniques',
  'Tapering and line-ups',
  'Shear cutting fundamentals',
  // Razor & Shaving
  'Straight razor safety',
  'Beard shaping and lining',
  'Skin protection and sanitation',
  // Client Services
  'Client consultation',
  'Communication and professionalism',
  'Time management and service efficiency',
  // Shop Operations
  'Equipment setup and breakdown',
  'Shop sanitation maintenance',
  'Appointment flow and customer service',
  'Workplace safety compliance',
];

export const CREDENTIALS = [
  { name: 'Rise Up', type: 'Certificate' as const, issuer: 'Licensed credential partner' },
  { name: 'Rise Up', type: 'Certificate' as const, issuer: 'Licensed credential partner' },
  { name: 'Registered Barber License', type: 'Licensure' as const, issuer: 'Indiana Professional Licensing Agency' },
];

export const CURRICULUM = [
  { title: 'Haircutting Techniques', description: 'Fades, tapers, lineups, and precision cutting under licensed supervision in a real shop environment.' },
  { title: 'Clipper & Shear Mastery', description: 'Tool selection, maintenance, guard systems, and advanced clipper-over-comb and shear techniques.' },
  { title: 'Sanitation & Safety', description: 'Indiana State Board sanitation standards, chemical safety, bloodborne pathogen protocols, and workstation compliance.' },
  { title: 'Shaving & Beard Grooming', description: 'Straight razor safety, beard shaping, lining, skin protection, and hot towel service techniques.' },
  { title: 'Client Services & Professionalism', description: 'Client consultation, communication, time management, and building a repeat client base.' },
  { title: 'Shop Operations & Business', description: 'Booth rental basics, appointment management, business licensing, and shop ownership preparation.' },
  { title: 'License Exam Preparation', description: 'Indiana barber license exam prep including written test review, practical exam practice, and State Board requirements.' },
  { title: 'Competency Evaluations', description: 'Monthly rubric-based assessments, tri-party verification (RTI + Employer + Program), and documented skill progression.' },
];

export const CAREERS = [
  { title: 'Licensed Barber', salary: '$30K-$50K', demand: 'High demand' },
  { title: 'Senior Barber / Stylist', salary: '$50K-$70K', demand: 'Experience-based' },
  { title: 'Shop Manager', salary: '$45K-$65K', demand: 'Leadership path' },
  { title: 'Shop Owner', salary: '$60K-$120K+', demand: 'Entrepreneurship' },
];

export const ENROLLMENT_STEPS = [
  { title: 'Complete Intake', description: 'Submit the funding and eligibility intake form online. Answer questions about your background, work history, and payment preferences. No documents needed at this stage.' },
  { title: 'Get Matched', description: 'Our team pairs you with a licensed barber instructor at a partner barbershop near you. Meet your instructor, tour the shop, and agree on a training schedule and employment model.' },
  { title: 'Earn While You Learn', description: 'Complete 2,000 on-the-job training hours at the shop plus required classroom instruction. Training models include hourly paid, booth-based, or hybrid arrangements depending on the partner shop.' },
  { title: 'Get Licensed', description: 'After completing all required hours and coursework, sit for the Indiana State Board barber exam. We provide exam prep materials and practice tests. Pass and receive your Indiana barber license.' },
];

export const ELIGIBILITY = [
  'At least 16 years old with a valid government-issued ID',
  'No prior barbering experience required',
  'High school diploma or GED preferred but not mandatory for all payment options',
  'Ability to stand for extended periods and perform repetitive hand motions',
  'Pass background check (required by some partner shops)',
];

export const PARTNER_REQUIREMENTS = [
  'Active and valid Indiana barbershop license in good standing',
  'At least one licensed barber available for supervision with 2+ years experience',
  'Workers\' compensation insurance',
  'Physical shop location in Indiana',
  'Commitment to structured OJT training and monthly evaluations',
  'Compliance with sanitation and workplace training standards',
  'Signed Memorandum of Understanding (MOU) before placement begins',
];

export const PARTNER_BENEFITS = [
  'Access to trained apprentices gaining real shop experience',
  'Workforce development participation and recognition',
  'Increased shop visibility as an approved training site',
  'Structured evaluation tools and support from program oversight',
  'First pick of trained talent upon program completion',
  'Zero paperwork burden — Elevate handles compliance and documentation',
];
