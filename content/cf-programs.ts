/**
 * Marketing program content — fallback for ISR pages when DB is unavailable.
 * Keep in sync with data/programs/ catalog (39 programs).
 */

export type MarketingProgram = {
  slug: string;
  title: string;
  summary: string;
  description: string;  sections: Array<{ heading: string; body: string }>;
};

export const programs: MarketingProgram[] = [
  // ── Healthcare ──────────────────────────────────────────────────────────────
  {
    slug: 'cna',
    title: 'Certified Nursing Assistant (CNA)',
    summary: 'Indiana state CNA certification in 6 weeks.',
    description: 'Clinical rotations at licensed healthcare facilities. State exam proctored on-site. WIOA and Workforce Ready Grant funding available.',
    sections: [
      { heading: 'What you will learn', body: 'Patient care, vital signs, infection control, and clinical skills required for Indiana CNA licensure.' },
      { heading: 'Funding available', body: 'WIOA and Indiana Workforce Ready Grant funding available for eligible residents.' },
    ],
  },
  {
    slug: 'medical-assistant',
    title: 'Medical Assistant',
    summary: 'Prepare for the CCMA certification exam in 12 weeks.',
    description: 'Clinical and administrative medical assisting skills. NHA Certified Clinical Medical Assistant (CCMA).',
    sections: [
      { heading: 'What you will learn', body: 'Clinical procedures, EHR systems, medical billing basics, and patient communication.' },
      { heading: 'Credential earned', body: 'NHA Certified Clinical Medical Assistant (CCMA).' },
    ],
  },
  {
    slug: 'phlebotomy',
    title: 'Phlebotomy Technician',
    summary: 'Complete 120 hours of classroom and clinical training in 4 weeks.',
    description: 'Prepare for the NHA Certified Phlebotomy Technician (CPT) exam and enter healthcare within a month.',
    sections: [
      { heading: 'What you will learn', body: 'Venipuncture, specimen handling, infection control, and clinical lab procedures.' },
      { heading: 'Credential earned', body: 'NHA Certified Phlebotomy Technician (CPT).' },
    ],
  },
  {
    slug: 'pharmacy-technician',
    title: 'Pharmacy Technician',
    summary: 'Prepare for the PTCB CPhT exam in 10 weeks.',
    description: 'Learn medication dispensing, pharmacy law, sterile compounding, and inventory management.',
    sections: [
      { heading: 'What you will learn', body: 'Medication dispensing, pharmacy law, sterile compounding, and inventory management.' },
      { heading: 'Credential earned', body: 'PTCB Certified Pharmacy Technician (CPhT).' },
    ],
  },
  {
    slug: 'home-health-aide',
    title: 'Home Health Aide Certification',
    summary: 'Become a certified Home Health Aide in 4 weeks.',
    description: 'Earn CCHW and HHA certifications for in-home care careers.',
    sections: [
      { heading: 'What you will learn', body: 'Personal care, medication assistance, patient safety, and documentation for in-home care settings.' },
      { heading: 'Credentials earned', body: 'CCHW and HHA certifications.' },
    ],
  },
  {
    slug: 'qma',
    title: 'Qualified Medication Aide (QMA)',
    summary: 'Indiana state QMA certification in 4 weeks.',
    description: 'Administer medications under nurse supervision in residential care settings. WIOA and WRG funding available.',
    sections: [
      { heading: 'What you will learn', body: 'Medication administration, documentation, resident rights, and infection control.' },
      { heading: 'Funding available', body: 'WIOA and Indiana Workforce Ready Grant funding available for eligible residents.' },
    ],
  },
  {
    slug: 'peer-recovery-specialist',
    title: 'Peer Recovery Specialist',
    summary: 'Earn your Indiana CPRS credential in 8 weeks.',
    description: 'Help others overcome addiction and mental health challenges. Indiana Certified Peer Recovery Specialist (CPRS).',
    sections: [
      { heading: 'What you will learn', body: 'Recovery coaching, motivational interviewing, ethics, and peer support best practices.' },
      { heading: 'Credential earned', body: 'Indiana Certified Peer Recovery Specialist (CPRS).' },
    ],
  },
  {
    slug: 'cpr-first-aid',
    title: 'CPR & First Aid Certification',
    summary: 'Live instructor-led training. Train from home.',
    description: 'Mannequin shipped to your door. Live instructor-led virtual training for CPR, AED, and First Aid certification.',
    sections: [
      { heading: 'What you will learn', body: 'CPR, AED operation, choking response, and basic first aid for adults, children, and infants.' },
      { heading: 'Credential earned', body: 'CPR/AED and First Aid certification.' },
    ],
  },
  {
    slug: 'emergency-health-safety',
    title: 'Emergency Health & Safety Technician',
    summary: '4-week hybrid program. EMR, CPR/AED, First Aid, and OSHA 10.',
    description: 'Earn EMR, CPR/AED, First Aid, and OSHA 10 certifications for healthcare and public safety careers.',
    sections: [
      { heading: 'What you will learn', body: 'Emergency medical response, CPR/AED, first aid, and OSHA workplace safety.' },
      { heading: 'Credentials earned', body: 'EMR, CPR/AED, First Aid, and OSHA 10.' },
    ],
  },
  {
    slug: 'sanitation-infection-control',
    title: 'Sanitation & Infection Control',
    summary: 'ServSafe and infection control certifications in 2 weeks.',
    description: 'Prepare for infection control and ServSafe certifications for healthcare, food service, and personal services industries.',
    sections: [
      { heading: 'What you will learn', body: 'Infection prevention, sanitation protocols, food safety, and OSHA bloodborne pathogen standards.' },
      { heading: 'Credentials earned', body: 'ServSafe and infection control certifications.' },
    ],
  },
  // ── Skilled Trades ──────────────────────────────────────────────────────────
  {
    slug: 'hvac-technician',
    title: 'HVAC Technician',
    summary: 'Install, service, and repair heating and cooling systems.',
    description: 'EPA 608 Universal certification proctored on-site. 6 weeks. WIOA and Workforce Ready Grant funding available for eligible Indiana residents.',
    sections: [
      { heading: 'What you will learn', body: 'Refrigeration fundamentals, electrical systems, EPA 608 certification prep, and hands-on equipment service.' },
      { heading: 'Funding available', body: 'WIOA and Indiana Workforce Ready Grant funding available for eligible residents.' },
    ],
  },
  {
    slug: 'electrical',
    title: 'Electrical Technician',
    summary: 'Learn residential and commercial wiring, electrical theory, and NEC code.',
    description: 'Graduate with OSHA 30 and NCCER credentials in 12 weeks.',
    sections: [
      { heading: 'What you will learn', body: 'Electrical theory, NEC code, residential and commercial wiring, and safety practices.' },
      { heading: 'Credentials earned', body: 'OSHA 30 and NCCER credentials.' },
    ],
  },
  {
    slug: 'welding',
    title: 'Welding Technology',
    summary: 'Learn MIG, TIG, and stick welding.',
    description: 'Prepare for AWS certifications and enter the skilled trades workforce in 10 weeks.',
    sections: [
      { heading: 'What you will learn', body: 'MIG, TIG, and stick welding techniques, blueprint reading, and workplace safety.' },
      { heading: 'Credential earned', body: 'AWS welding certifications.' },
    ],
  },
  {
    slug: 'plumbing',
    title: 'Plumbing Technician',
    summary: 'Install and repair residential and commercial plumbing systems.',
    description: 'Earn OSHA 10 and NCCER credentials in 10 weeks.',
    sections: [
      { heading: 'What you will learn', body: 'Pipe fitting, fixture installation, drainage systems, and plumbing code.' },
      { heading: 'Credentials earned', body: 'OSHA 10 and NCCER credentials.' },
    ],
  },
  {
    slug: 'construction-trades-certification',
    title: 'Construction Trades Certification',
    summary: 'Earn OSHA 30, EPA 608, and forklift certifications in 8 weeks.',
    description: 'Multi-trade foundation for construction careers.',
    sections: [
      { heading: 'What you will learn', body: 'Construction safety, EPA 608 refrigerant handling, forklift operation, and OSHA compliance.' },
      { heading: 'Credentials earned', body: 'OSHA 30, EPA 608, and Forklift Operator certifications.' },
    ],
  },
  {
    slug: 'diesel-mechanic',
    title: 'Diesel Mechanic',
    summary: 'Diagnose and repair diesel engines, transmissions, and hydraulic systems.',
    description: 'OSHA 10 and ASE prep in 12 weeks.',
    sections: [
      { heading: 'What you will learn', body: 'Diesel engine diagnostics, transmission repair, hydraulic systems, and preventive maintenance.' },
      { heading: 'Credentials earned', body: 'OSHA 10 and ASE preparation.' },
    ],
  },
  {
    slug: 'forklift',
    title: 'Forklift Operator Certification',
    summary: 'OSHA-compliant forklift certification in 1 week.',
    description: 'Hands-on training on sit-down, stand-up, and reach truck forklifts.',
    sections: [
      { heading: 'What you will learn', body: 'Forklift operation, pre-trip inspection, load handling, and OSHA safety standards.' },
      { heading: 'Credential earned', body: 'OSHA-compliant Forklift Operator certification.' },
    ],
  },
  // ── Transportation ──────────────────────────────────────────────────────────
  {
    slug: 'cdl-training',
    title: 'CDL Class A Training',
    summary: "Get your Commercial Driver's License.",
    description: 'Hands-on CDL Class A training with job placement support.',
    sections: [
      { heading: 'What you will learn', body: 'Pre-trip inspection, backing maneuvers, road driving, and DOT regulations.' },
      { heading: 'Credential earned', body: 'CDL Class A License.' },
    ],
  },
  // ── Personal Services ───────────────────────────────────────────────────────
  {
    slug: 'barber-apprenticeship',
    title: 'Barber Apprenticeship',
    summary: 'DOL Registered Apprenticeship in barbering.',
    description: 'Complete 2,000 hours of training (1,500 OJT + 500 RTI) to earn your Indiana Barber License.',
    sections: [
      { heading: 'What you will learn', body: 'Haircutting, sanitation, client service, state-aligned skill development, and practical readiness.' },
      { heading: 'Credential earned', body: 'Indiana Barber License.' },
    ],
  },
  {
    slug: 'cosmetology-apprenticeship',
    title: 'Cosmetology Apprenticeship',
    summary: 'Earn your Indiana cosmetology license through a registered apprenticeship.',
    description: '2,000 hours of supervised training in a licensed salon.',
    sections: [
      { heading: 'What you will learn', body: 'Hair cutting, coloring, chemical services, skin care, and salon business operations.' },
      { heading: 'Credential earned', body: 'Indiana Cosmetology License.' },
    ],
  },
  {
    slug: 'nail-technician-apprenticeship',
    title: 'Nail Technician Apprenticeship',
    summary: 'Earn your Indiana nail technician license through a registered apprenticeship.',
    description: '600 hours of supervised training.',
    sections: [
      { heading: 'What you will learn', body: 'Nail care, gel and acrylic application, sanitation, and client services.' },
      { heading: 'Credential earned', body: 'Indiana Nail Technician License.' },
    ],
  },
  {
    slug: 'esthetician',
    title: 'Professional Esthetician & Client Services',
    summary: '5-week accelerated non-licensure certificate.',
    description: 'Skin analysis, facial treatments, hair removal, and business startup — WIOA funded.',
    sections: [
      { heading: 'What you will learn', body: 'Skin science, facial treatments, hair removal, client services, and business fundamentals.' },
      { heading: 'Funding available', body: 'WIOA funding available for eligible participants.' },
    ],
  },
  {
    slug: 'culinary-apprenticeship',
    title: 'Culinary Apprenticeship',
    summary: 'Earn ServSafe certification through a registered apprenticeship.',
    description: 'Hands-on training in a professional kitchen. 12-month program.',
    sections: [
      { heading: 'What you will learn', body: 'Professional kitchen operations, food safety, culinary techniques, and ServSafe certification.' },
      { heading: 'Credential earned', body: 'ServSafe certification.' },
    ],
  },
  {
    slug: 'beauty-career-educator',
    title: 'Beauty & Career Educator Training',
    summary: '12-week hybrid program for salon professionals moving into education.',
    description: 'Combining salon services, peer teaching, entrepreneurship, and workforce readiness.',
    sections: [
      { heading: 'What you will learn', body: 'Salon services, instructional techniques, curriculum design, and business development.' },
      { heading: 'Who this is for', body: 'Licensed cosmetologists and barbers seeking to transition into education or salon management.' },
    ],
  },
  {
    slug: 'hospitality',
    title: 'Hospitality & Customer Service',
    summary: 'Build a career in hotels, restaurants, and event services.',
    description: 'Earn industry-recognized credentials in hospitality operations and customer service.',
    sections: [
      { heading: 'What you will learn', body: 'Guest services, front desk operations, food and beverage basics, and event coordination.' },
      { heading: 'Credentials earned', body: 'Hospitality industry certifications.' },
    ],
  },
  // ── Technology ──────────────────────────────────────────────────────────────
  {
    slug: 'it-help-desk',
    title: 'IT Help Desk Technician',
    summary: 'Troubleshoot hardware, software, and networks.',
    description: 'Prepare for CompTIA A+ in 8 weeks and launch your IT career.',
    sections: [
      { heading: 'What you will learn', body: 'Hardware troubleshooting, OS support, networking basics, and customer service.' },
      { heading: 'Credential earned', body: 'CompTIA A+.' },
    ],
  },
  {
    slug: 'cybersecurity-analyst',
    title: 'Cybersecurity Analyst',
    summary: 'Protect networks and data from cyber threats.',
    description: 'Prepare for CompTIA Security+ in 12 weeks.',
    sections: [
      { heading: 'What you will learn', body: 'Network security, threat analysis, incident response, and security operations.' },
      { heading: 'Credential earned', body: 'CompTIA Security+.' },
    ],
  },
  {
    slug: 'network-support-technician',
    title: 'Network Support Technician',
    summary: 'Entry-level network support and help desk skills in 6 weeks.',
    description: 'Prepare for IT Specialist certification in networking.',
    sections: [
      { heading: 'What you will learn', body: 'Network fundamentals, TCP/IP, troubleshooting, and help desk support.' },
      { heading: 'Credential earned', body: 'IT Specialist — Networking.' },
    ],
  },
  {
    slug: 'network-administration',
    title: 'Network Administration',
    summary: 'Prepare for CompTIA Network+ certification in 10 weeks.',
    description: 'Network design, configuration, and troubleshooting.',
    sections: [
      { heading: 'What you will learn', body: 'Network design, routing and switching, VLANs, firewalls, and network troubleshooting.' },
      { heading: 'Credential earned', body: 'CompTIA Network+.' },
    ],
  },
  {
    slug: 'web-development',
    title: 'Web Development',
    summary: 'Learn HTML, CSS, JavaScript, and WordPress.',
    description: 'Prepare for Meta Front-End Developer and WordPress certifications in 12 weeks.',
    sections: [
      { heading: 'What you will learn', body: 'HTML, CSS, JavaScript, responsive design, and WordPress development.' },
      { heading: 'Credentials earned', body: 'Meta Front-End Developer and WordPress certifications.' },
    ],
  },
  {
    slug: 'software-development',
    title: 'Software Development Foundations',
    summary: 'Learn Python, databases, and software engineering fundamentals.',
    description: 'Prepare for IT Specialist certifications in 12 weeks.',
    sections: [
      { heading: 'What you will learn', body: 'Python programming, databases, version control, and software development practices.' },
      { heading: 'Credential earned', body: 'IT Specialist certifications.' },
    ],
  },
  {
    slug: 'graphic-design',
    title: 'Graphic Design',
    summary: 'Learn Adobe Photoshop, Illustrator, and InDesign.',
    description: 'Prepare for Adobe Certified Professional credentials in 10 weeks.',
    sections: [
      { heading: 'What you will learn', body: 'Adobe Photoshop, Illustrator, InDesign, typography, and visual communication.' },
      { heading: 'Credential earned', body: 'Adobe Certified Professional.' },
    ],
  },
  {
    slug: 'cad-drafting',
    title: 'CAD/Drafting Technician',
    summary: 'Learn AutoCAD and Revit for architectural and mechanical drafting.',
    description: 'Prepare for Autodesk Certified User credentials in 10 weeks.',
    sections: [
      { heading: 'What you will learn', body: 'AutoCAD, Revit, technical drawing, and architectural/mechanical drafting.' },
      { heading: 'Credential earned', body: 'Autodesk Certified User.' },
    ],
  },
  {
    slug: 'technology',
    title: 'Technology Career Training',
    summary: 'Launch a tech career with industry-recognized certifications.',
    description: 'IT support, cybersecurity, networking, and software development pathways.',
    sections: [
      { heading: 'What you will learn', body: 'IT fundamentals, networking, cybersecurity basics, and software development foundations.' },
      { heading: 'Credentials earned', body: 'CompTIA, Certiport, and Microsoft certifications.' },
    ],
  },
  // ── Business ────────────────────────────────────────────────────────────────
  {
    slug: 'bookkeeping',
    title: 'Bookkeeping & QuickBooks',
    summary: 'Master small business accounting.',
    description: 'Prepare for the QuickBooks Certified User exam in 5 weeks.',
    sections: [
      { heading: 'What you will learn', body: 'Accounts payable/receivable, payroll basics, financial reporting, and QuickBooks.' },
      { heading: 'Credential earned', body: 'QuickBooks Certified User.' },
    ],
  },
  {
    slug: 'project-management',
    title: 'Project Management',
    summary: 'Prepare for Certiport Project Management certification.',
    description: 'Agile, Scrum, and traditional PM methodologies in 6 weeks.',
    sections: [
      { heading: 'What you will learn', body: 'Project planning, Agile/Scrum, risk management, and stakeholder communication.' },
      { heading: 'Credential earned', body: 'Certiport Project Management certification.' },
    ],
  },
  {
    slug: 'business-administration',
    title: 'Business Administration',
    summary: 'Prepare for Certiport business certifications in 8 weeks.',
    description: 'Microsoft Office, QuickBooks, and business fundamentals.',
    sections: [
      { heading: 'What you will learn', body: 'Microsoft Office Suite, business communication, QuickBooks basics, and office management.' },
      { heading: 'Credentials earned', body: 'Microsoft Office Specialist and Certiport business certifications.' },
    ],
  },
  {
    slug: 'office-administration',
    title: 'Office Administration',
    summary: 'Master Microsoft Office and business communication.',
    description: 'Prepare for Microsoft Office Specialist certifications in 6 weeks.',
    sections: [
      { heading: 'What you will learn', body: 'Word, Excel, PowerPoint, Outlook, business writing, and office procedures.' },
      { heading: 'Credential earned', body: 'Microsoft Office Specialist (MOS).' },
    ],
  },
  {
    slug: 'entrepreneurship',
    title: 'Entrepreneurship & Small Business',
    summary: 'Launch or grow your business.',
    description: 'Business planning, marketing, financial management, and Certiport ESB certification in 6 weeks.',
    sections: [
      { heading: 'What you will learn', body: 'Business planning, marketing strategy, financial management, and small business operations.' },
      { heading: 'Credential earned', body: 'Certiport Entrepreneurship & Small Business (ESB) certification.' },
    ],
  },
];
