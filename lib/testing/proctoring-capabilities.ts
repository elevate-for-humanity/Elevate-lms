/**
 * Proctoring capability model for Elevate's testing center.
 *
 * Three capability types:
 *   IN_PERSON_ONLY            — exam must be taken at a physical testing site
 *   IN_PERSON_OR_PROVIDER_REMOTE — provider runs their own remote system; center can also host in-person
 *   CENTER_REMOTE_ALLOWED     — Elevate can proctor live online (center-controlled remote)
 *
 * This drives what booking options appear in the UI and prevents compliance errors
 * (e.g. offering remote proctoring for an exam that requires in-person supervision).
 */

export type ProctoringCapability =
  | 'IN_PERSON_ONLY'
  | 'IN_PERSON_OR_PROVIDER_REMOTE'
  | 'CENTER_REMOTE_ALLOWED';

export interface ExamFee {
  /** Label shown to the test-taker, e.g. "Per assessment" */
  label: string;
  /** Amount in dollars charged to the test-taker */
  amount: number;
  /** Optional note, e.g. "Includes $13.50 ACT fee + $31.50 proctoring" */
  note?: string;
}

export interface ExamDefinition {
  /** Short name shown in lists */
  name: string;
  /** What this exam actually measures — shown on the provider detail page */
  description?: string;
  /** NCRC level earned on passing (WorkKeys specific) */
  ncrcLevel?: string;
  /** Typical duration in minutes */
  durationMinutes?: number;
  /** Number of questions */
  questionCount?: number;
}

export interface CertProvider {
  key: string;
  name: string;
  capability: ProctoringCapability;
  /** Short description of what this provider certifies */
  description: string;
  /**
   * Exams/credentials available through this provider.
   * Can be plain strings (legacy) or ExamDefinition objects with descriptions.
   */
  exams: (string | ExamDefinition)[];
  /** External verification or scheduling URL */
  verifyUrl?: string;
  /** Whether Elevate is currently an active authorized site */
  status: 'active' | 'available_through_partner';
  /** Hide from public-facing pages (e.g. not yet offered, internal only) */
  publicVisible?: boolean;
  /**
   * Fees charged to test-takers. Multiple entries for different exam types.
   * If empty, pricing is quoted on request.
   */
  fees?: ExamFee[];
  /** Group/bulk discount note */
  groupDiscount?: string;
  /**
   * Optional upsell add-on available at checkout.
   * When present, the booking flow offers this as a checkbox.
   */
  addOn?: {
    label: string;
    description: string;
    amountCents: number;
    includes: string[];
  };
}

export interface ProctoringOptions {
  inPerson: boolean;
  remoteProvider: boolean;  // provider controls the remote system
  remoteCenter: boolean;    // Elevate runs live online proctoring
}

export const CERT_PROVIDERS: Record<string, CertProvider> = {
  esco: {
    key: 'esco',
    name: 'EPA Section 608 (ESCO Institute)',
    capability: 'IN_PERSON_ONLY',
    description: 'Federal refrigerant handling certification required by the EPA Clean Air Act. It is illegal to purchase or handle refrigerants without this certification. Elevate is a nationally authorized proctor site for both ESCO Group and Mainstream Engineering. Required for any HVAC technician who services, maintains, or disposes of equipment containing refrigerants.',
    exams: [
      {
        name: 'Core',
        description: 'Covers EPA regulations, refrigerant safety, environmental impact of ozone-depleting substances, and proper handling procedures. Required as part of every certification type. Must pass Core to earn any Section 608 certificate.',
        durationMinutes: 20,
        questionCount: 25,
      },
      {
        name: 'Type I — Small Appliances',
        description: 'Covers equipment containing 5 lbs or less of refrigerant — window AC units, refrigerators, freezers, and dehumidifiers. Focuses on safe recovery techniques for sealed systems.',
        durationMinutes: 20,
        questionCount: 25,
      },
      {
        name: 'Type II — High-Pressure',
        description: 'Covers high-pressure systems using refrigerants like R-22 and R-410A — residential and commercial AC, heat pumps, and refrigeration equipment. The most common certification for residential HVAC technicians.',
        durationMinutes: 20,
        questionCount: 25,
      },
      {
        name: 'Type III — Low-Pressure',
        description: 'Covers low-pressure systems using refrigerants like R-11 and R-123 — large commercial chillers found in office buildings, hospitals, and industrial facilities.',
        durationMinutes: 20,
        questionCount: 25,
      },
      {
        name: 'Universal (All Sections)',
        description: 'Passes all four sections — Core, Type I, Type II, and Type III — in a single sitting. Required for technicians who work across residential, commercial, and industrial systems. Most employers require Universal certification.',
        durationMinutes: 80,
        questionCount: 100,
      },
    ],
    verifyUrl: 'https://www.escogroup.org/esco/certifications/epa608.aspx',
    status: 'active',
    fees: [
      { label: 'Universal (all sections)', amount: 55, note: 'Includes exam fee + proctoring' },
      { label: 'Single section', amount: 35, note: 'Includes exam fee + proctoring' },
    ],
    groupDiscount: 'Groups of 5+ — contact us for employer/cohort pricing',
    ncrcJobProfiles: [
      {
        level: 'Type I',
        score: 'Small Appliances',
        color: 'slate',
        jobs: [
          { title: 'Appliance Repair Technician', note: 'Refrigerators, window AC, dehumidifiers' },
          { title: 'Property Maintenance Tech', note: 'Apartment complexes, hotels' },
        ],
      },
      {
        level: 'Type II',
        score: 'High-Pressure Systems',
        color: 'amber',
        jobs: [
          { title: 'Residential HVAC Technician', note: 'Central AC, heat pumps, split systems' },
          { title: 'HVAC Installer', note: 'New construction and replacement systems' },
          { title: 'Refrigeration Technician', note: 'Grocery stores, restaurants, cold storage' },
        ],
      },
      {
        level: 'Type III',
        score: 'Low-Pressure Systems',
        color: 'blue',
        jobs: [
          { title: 'Commercial Chiller Technician', note: 'Office buildings, hospitals, industrial' },
          { title: 'Building Engineer', note: 'Large facility HVAC systems' },
        ],
      },
      {
        level: 'Universal',
        score: 'All Systems',
        color: 'yellow',
        jobs: [
          { title: 'HVAC/R Technician (Full)', note: 'Residential, commercial, and industrial — required by most employers' },
          { title: 'HVAC Service Manager', note: 'Supervises technicians across all system types' },
          { title: 'Union HVAC Apprentice', note: 'Sheet Metal Workers, UA Plumbers — Universal required at entry' },
          { title: 'Facilities Engineer', note: 'Hospitals, universities, manufacturing plants' },
        ],
      },
    ],
  },
  nrf: {
    key: 'nrf',
    name: 'NRF RISE Up (National Retail Federation)',
    capability: 'IN_PERSON_ONLY',
    description: 'NRF RISE Up credentials are nationally recognized workforce certifications for customer service, retail, and business roles. Issued by the National Retail Federation Foundation — the largest retail trade association in the world. Recognized by major employers including Walmart, Target, Macy\'s, and thousands of small businesses.',
    exams: [
      {
        name: 'Retail Industry Fundamentals',
        description: 'Entry-level credential covering the basics of working in retail — store operations, customer interaction, product handling, and workplace safety. Designed for first-time job seekers and career changers entering retail or service industries.',
        durationMinutes: 60,
        questionCount: 60,
      },
      {
        name: 'Customer Service & Sales',
        description: 'Covers professional customer service skills, sales techniques, handling complaints, building customer loyalty, and meeting sales goals. Validates readiness for customer-facing roles across retail, hospitality, and service industries.',
        durationMinutes: 60,
        questionCount: 60,
      },
      {
        name: 'Business of Retail: Operations & Profit',
        description: 'Covers retail business operations — inventory management, merchandising, loss prevention, financial basics, and store performance metrics. Designed for candidates moving into supervisory or management roles.',
        durationMinutes: 60,
        questionCount: 60,
      },
    ],
    verifyUrl: 'https://nrffoundation.org/riseup',
    status: 'active',
    fees: [
      { label: 'Per credential exam', amount: 45, note: 'Includes exam fee + proctoring' },
    ],
    ncrcJobProfiles: [
      {
        level: 'Retail Industry Fundamentals',
        score: 'Entry Level',
        color: 'slate',
        jobs: [
          { title: 'Retail Sales Associate', note: 'Cashier, floor associate, stock' },
          { title: 'Food Service Worker', note: 'Counter service, cafeteria, fast food' },
          { title: 'Warehouse / Fulfillment Associate', note: 'Picking, packing, shipping' },
          { title: 'Hotel Front Desk Clerk', note: 'Check-in, guest services' },
        ],
      },
      {
        level: 'Customer Service & Sales',
        score: 'Customer-Facing Roles',
        color: 'amber',
        jobs: [
          { title: 'Customer Service Representative', note: 'Call center, help desk, in-store' },
          { title: 'Inside Sales Rep', note: 'Phone and online sales' },
          { title: 'Bank Teller', note: 'Retail banking, member services' },
          { title: 'Insurance Customer Service', note: 'Policy support, claims intake' },
          { title: 'Leasing Consultant', note: 'Apartment and property rentals' },
        ],
      },
      {
        level: 'Business of Retail',
        score: 'Supervisory / Management',
        color: 'yellow',
        jobs: [
          { title: 'Retail Shift Supervisor', note: 'Team lead, opening/closing duties' },
          { title: 'Department Manager', note: 'Inventory, scheduling, performance' },
          { title: 'Assistant Store Manager', note: 'Operations, loss prevention, staffing' },
          { title: 'Merchandise Coordinator', note: 'Planogram, visual merchandising' },
        ],
      },
    ],
  },
  certiport: {
    key: 'certiport',
    name: 'Certiport Authorized Testing Center',
    capability: 'IN_PERSON_OR_PROVIDER_REMOTE',
    description: 'Elevate is an authorized Certiport testing center. Certiport delivers performance-based certification exams for Microsoft, Adobe, CompTIA, Intuit, and IC3. Exams are taken on a computer and test real-world skills — not just memorization. Credentials are issued by the respective technology company and recognized globally by employers.',
    exams: [
      {
        name: 'Microsoft Office Specialist (MOS)',
        description: 'Validates hands-on proficiency in Microsoft Office applications. Exams available for Word, Excel, PowerPoint, Outlook, and Access. Performance-based — you complete real tasks inside the application during the exam. Recognized by employers for administrative, accounting, and office roles.',
        questionCount: 35,
        durationMinutes: 50,
      },
      {
        name: 'IT Specialist',
        description: 'Entry-level IT certification series covering foundational programming and networking concepts. Exams available in Python, Java, HTML/CSS, JavaScript, Networking, Databases, and Cybersecurity. Ideal for students and career changers entering IT without prior experience.',
        durationMinutes: 45,
        questionCount: 40,
      },
      {
        name: 'Intuit QuickBooks Certified User',
        description: 'Validates proficiency in QuickBooks Online — the most widely used small business accounting software. Covers invoicing, payroll, bank reconciliation, reporting, and financial management. Required or preferred by many bookkeeping and accounting employers.',
        durationMinutes: 50,
        questionCount: 50,
      },
      {
        name: 'Entrepreneurship & Small Business (ESB)',
        description: 'Covers the fundamentals of starting and running a small business — business planning, marketing, financial management, and operations. Recognized by the Kauffman Foundation. Useful for aspiring entrepreneurs and small business employees.',
        durationMinutes: 50,
        questionCount: 50,
      },
      {
        name: 'IC3 Digital Literacy',
        description: 'Globally recognized digital literacy certification covering computer hardware, software, internet use, and online communication. Three modules: Computing Fundamentals, Key Applications, and Living Online. Widely accepted as proof of basic computer competency for employment and education.',
        durationMinutes: 45,
        questionCount: 45,
      },
      {
        name: 'Adobe Certified Professional',
        description: 'Validates creative skills in Adobe applications — Photoshop, Illustrator, InDesign, Premiere Pro, and After Effects. Performance-based exam completed inside the Adobe application. Recognized by creative agencies, marketing departments, and media companies.',
        durationMinutes: 50,
        questionCount: 40,
      },
      {
        name: 'CompTIA A+ · Network+ · Security+',
        description: 'Industry-standard IT certifications. A+ covers hardware and OS troubleshooting (entry-level IT support). Network+ covers networking concepts, protocols, and infrastructure. Security+ covers cybersecurity fundamentals and is DoD 8570 approved — required for many federal IT roles.',
        durationMinutes: 90,
        questionCount: 90,
      },
    ],
    verifyUrl: 'https://certiport.pearsonvue.com/Locator',
    status: 'active',
    fees: [
      { label: 'Per exam', amount: 65, note: 'Includes exam voucher + proctoring' },
    ],
    groupDiscount: 'Groups of 5+ — contact us for cohort pricing',
    ncrcJobProfiles: [
      {
        level: 'Microsoft Office Specialist',
        score: 'MOS Certified',
        color: 'blue',
        jobs: [
          { title: 'Administrative Assistant', note: 'Word, Excel, Outlook daily use' },
          { title: 'Data Entry Clerk', note: 'Excel, Access, spreadsheet management' },
          { title: 'Office Manager', note: 'Full Office suite required' },
          { title: 'Bookkeeper', note: 'Excel + QuickBooks common pairing' },
          { title: 'Legal / Medical Secretary', note: 'Word formatting, document management' },
        ],
      },
      {
        level: 'IT Specialist / CompTIA A+',
        score: 'Entry IT',
        color: 'slate',
        jobs: [
          { title: 'Help Desk Technician', note: 'Tier 1 IT support, ticketing systems' },
          { title: 'Desktop Support Specialist', note: 'Hardware, OS, software troubleshooting' },
          { title: 'IT Support Analyst', note: 'End-user support, remote and on-site' },
          { title: 'Field Service Technician', note: 'On-site hardware repair and setup' },
        ],
      },
      {
        level: 'CompTIA Network+ / Security+',
        score: 'Mid-Level IT',
        color: 'amber',
        jobs: [
          { title: 'Network Administrator', note: 'LAN/WAN, switches, routers, VPN' },
          { title: 'Cybersecurity Analyst (entry)', note: 'SOC Tier 1, threat monitoring' },
          { title: 'Systems Administrator', note: 'Servers, Active Directory, cloud basics' },
          { title: 'Federal IT Contractor', note: 'Security+ is DoD 8570 approved — required for many federal roles' },
        ],
      },
      {
        level: 'QuickBooks / ESB',
        score: 'Business & Finance',
        color: 'yellow',
        jobs: [
          { title: 'Bookkeeper', note: 'A/R, A/P, payroll, bank reconciliation' },
          { title: 'Accounting Clerk', note: 'QuickBooks required by most small business employers' },
          { title: 'Small Business Owner', note: 'ESB credential validates business planning skills' },
          { title: 'Tax Preparer', note: 'QuickBooks + tax software common pairing' },
        ],
      },
      {
        level: 'Adobe Certified Professional',
        score: 'Creative / Media',
        color: 'slate',
        jobs: [
          { title: 'Graphic Designer', note: 'Photoshop, Illustrator, InDesign' },
          { title: 'Video Editor', note: 'Premiere Pro, After Effects' },
          { title: 'Marketing Coordinator', note: 'Social media graphics, print materials' },
          { title: 'Web Designer', note: 'Adobe XD, Photoshop, Illustrator' },
        ],
      },
    ],
  },
  nha: {
    key: 'nha',
    name: 'NHA — National Healthcareer Association',
    capability: 'IN_PERSON_ONLY',
    description: 'NHA Authorized Testing Center (account #412957). NHA is one of the largest allied health certification bodies in the United States. Credentials are nationally recognized by hospitals, clinics, physician offices, and long-term care facilities. All exams are computer-based and proctored in person.',
    exams: [
      {
        name: 'Certified Phlebotomy Technician (CPT)',
        description: 'Validates skills in venipuncture, capillary puncture, specimen handling, and patient interaction. Phlebotomists draw blood for lab testing in hospitals, clinics, blood banks, and doctor\'s offices. One of the fastest paths into healthcare — training typically 4–8 weeks.',
        durationMinutes: 120,
        questionCount: 100,
      },
      {
        name: 'Certified Clinical Medical Assistant (CCMA)',
        description: 'Covers clinical and administrative duties — taking vital signs, preparing patients for exams, assisting with procedures, EKG, phlebotomy, and managing patient records. Medical assistants work in physician offices, urgent care, and outpatient clinics. One of the most in-demand healthcare credentials.',
        durationMinutes: 120,
        questionCount: 150,
      },
      {
        name: 'Certified EKG Technician (CET)',
        description: 'Validates the ability to perform electrocardiograms (EKGs/ECGs), Holter monitor setup, stress testing, and basic cardiac rhythm interpretation. EKG technicians work in hospitals, cardiology offices, and diagnostic centers.',
        durationMinutes: 90,
        questionCount: 100,
      },
      {
        name: 'Certified Patient Care Technician/Assistant (CPCT/A)',
        description: 'Covers direct patient care skills — vital signs, phlebotomy, EKG, catheter care, wound care, and patient mobility. Patient care techs work in hospitals and long-term care facilities, often as a stepping stone to RN or LPN programs.',
        durationMinutes: 120,
        questionCount: 150,
      },
      {
        name: 'Certified Medical Administrative Assistant (CMAA)',
        description: 'Covers front-office healthcare operations — scheduling, insurance verification, medical billing basics, HIPAA compliance, and patient communication. Medical administrative assistants work in physician offices, hospitals, and health systems.',
        durationMinutes: 90,
        questionCount: 110,
      },
      {
        name: 'Certified Pharmacy Technician — ExCPT',
        description: 'Validates pharmacy technician skills — prescription processing, drug dispensing, inventory management, compounding basics, and pharmacy law. ExCPT is accepted by most retail and hospital pharmacies. Required for licensure in many states.',
        durationMinutes: 110,
        questionCount: 120,
      },
    ],
    verifyUrl: 'https://www.nhanow.com/',
    status: 'active',
    // All NHA exams: $149 exam voucher (pass-through) + $94 testing & administration = $243 total.
    // Pricing locked per owner decision — do not modify without approval.
    fees: [
      { label: 'CPT — Phlebotomy',              amount: 243, note: '$149 NHA exam + $94 testing & administration' },
      { label: 'CCMA — Medical Assistant',       amount: 243, note: '$149 NHA exam + $94 testing & administration' },
      { label: 'CET — EKG Technician',           amount: 243, note: '$149 NHA exam + $94 testing & administration' },
      { label: 'ExCPT — Pharmacy Technician',    amount: 243, note: '$149 NHA exam + $94 testing & administration' },
      { label: 'CPCT/A — Patient Care Tech',     amount: 243, note: '$149 NHA exam + $94 testing & administration' },
      { label: 'CMAA — Medical Admin Assistant', amount: 243, note: '$149 NHA exam + $94 testing & administration' },
    ],
    groupDiscount: 'Groups of 5+ — contact us for cohort pricing',
    ncrcJobProfiles: [
      {
        level: 'CPT / CET',
        score: 'Diagnostic Support',
        color: 'slate',
        jobs: [
          { title: 'Phlebotomist', note: 'Hospitals, labs, blood banks, clinics' },
          { title: 'EKG Technician', note: 'Cardiology offices, hospitals, diagnostic centers' },
          { title: 'Lab Assistant', note: 'Specimen processing, clinical laboratories' },
        ],
      },
      {
        level: 'CCMA / CPCT/A',
        score: 'Clinical Care',
        color: 'amber',
        jobs: [
          { title: 'Medical Assistant', note: 'Physician offices, urgent care, outpatient clinics' },
          { title: 'Patient Care Technician', note: 'Hospital floors, med-surg, telemetry units' },
          { title: 'Clinical Support Specialist', note: 'Multi-specialty clinics, health systems' },
          { title: 'Home Health Aide (advanced)', note: 'In-home patient care with clinical skills' },
        ],
      },
      {
        level: 'CMAA',
        score: 'Healthcare Administration',
        color: 'blue',
        jobs: [
          { title: 'Medical Receptionist', note: 'Front desk, scheduling, insurance verification' },
          { title: 'Medical Billing Specialist', note: 'Claims processing, A/R, coding support' },
          { title: 'Health Unit Coordinator', note: 'Hospital floor administration, orders management' },
          { title: 'Prior Authorization Specialist', note: 'Insurance approvals, referral management' },
        ],
      },
      {
        level: 'ExCPT',
        score: 'Pharmacy',
        color: 'yellow',
        jobs: [
          { title: 'Pharmacy Technician', note: 'Retail pharmacy — CVS, Walgreens, Walmart, independent' },
          { title: 'Hospital Pharmacy Tech', note: 'Inpatient dispensing, IV compounding' },
          { title: 'Mail-Order Pharmacy Tech', note: 'High-volume prescription processing' },
          { title: 'Pharmacy Tech Supervisor', note: 'With experience — team lead, training' },
        ],
      },
    ],
    addOn: {
      label: 'Certification Success Package',
      description: 'Boost your pass rate with targeted prep materials.',
      amountCents: 5900,
      includes: [
        'Full-length NHA practice test',
        'Study guide with exam blueprint breakdown',
        'Retake strategy session (if needed)',
        'Email support from our prep team',
      ],
    },
  },
  workkeys: {
    key: 'workkeys',
    name: 'ACT WorkKeys / NCRC',
    capability: 'IN_PERSON_ONLY',
    description: 'The National Career Readiness Certificate (NCRC) is a portable, evidence-based credential recognized by 22,000+ employers nationwide. Earned by passing three ACT WorkKeys assessments. Elevate is an authorized ACT testing site (Realm: 1317721865). Scores are valid for 5 years.',
    exams: [
      {
        name: 'Applied Math',
        description: 'Measures the math skills workers use on the job — reading charts and graphs, calculating measurements, handling money, and solving multi-step problems. Tests levels 3–7. Most jobs require Level 5 or higher. No algebra required; a calculator is provided.',
        ncrcLevel: 'Bronze (3–4) · Silver (5) · Gold (6) · Platinum (7)',
        durationMinutes: 55,
        questionCount: 33,
      },
      {
        name: 'Workplace Documents',
        description: 'Measures the ability to read and use workplace documents — forms, charts, policies, schedules, and instructions. Tests whether a candidate can find information, follow multi-step directions, and apply what they read to real job tasks. Tests levels 3–7.',
        ncrcLevel: 'Bronze (3–4) · Silver (5) · Gold (6) · Platinum (7)',
        durationMinutes: 55,
        questionCount: 35,
      },
      {
        name: 'Graphic Literacy',
        description: 'Measures the ability to read and interpret workplace graphics — charts, graphs, diagrams, tables, and maps — and use that information to make decisions or solve problems. Tests levels 3–7.',
        ncrcLevel: 'Bronze (3–4) · Silver (5) · Gold (6) · Platinum (7)',
        durationMinutes: 55,
        questionCount: 38,
      },
      {
        name: 'National Career Readiness Certificate (NCRC)',
        description: 'Earned by completing all three WorkKeys assessments (Applied Math, Workplace Documents, Graphic Literacy). The NCRC level — Bronze, Silver, Gold, or Platinum — is determined by the lowest score across the three tests. Recognized by employers, workforce agencies, and state governments as proof of job readiness.',
        ncrcLevel: 'Bronze · Silver · Gold · Platinum',
      },
    ],
    verifyUrl: 'https://www.act.org/content/act/en/products-and-services/workkeys-for-job-seekers.html',
    status: 'active',
    fees: [
      { label: 'Per assessment (individual)', amount: 45, note: 'Includes ACT fee + proctoring' },
      { label: 'Full NCRC (3 assessments)', amount: 120, note: 'Applied Math + Workplace Documents + Graphic Literacy' },
      { label: 'Per assessment (workforce agency referral)', amount: 35, note: 'WorkOne / WIOA-referred candidates' },
    ],
    groupDiscount: 'Groups of 5+ — $30/assessment. Contact us for employer or cohort scheduling.',
    /**
     * NCRC level requirements by career/industry.
     * Source: ACT WorkKeys Job Profiles database + employer requirements.
     * Shown on the provider detail page so candidates know what score to aim for.
     */
    ncrcJobProfiles: [
      {
        level: 'Bronze',
        score: 'Level 3–4',
        color: 'amber',
        jobs: [
          { title: 'Warehouse Associate', note: 'Entry-level receiving, stocking, shipping' },
          { title: 'Food Service Worker', note: 'Restaurant, cafeteria, catering' },
          { title: 'Retail Sales Associate', note: 'Cashier, stock, customer service' },
          { title: 'Custodial / Janitorial', note: 'Facilities maintenance' },
          { title: 'Laundry / Linen Services', note: 'Healthcare and hospitality settings' },
        ],
      },
      {
        level: 'Silver',
        score: 'Level 5',
        color: 'slate',
        jobs: [
          { title: 'Medical Assistant / CNA', note: 'Clinical support, patient care' },
          { title: 'Pharmacy Technician', note: 'Retail and hospital pharmacy' },
          { title: 'HVAC Technician', note: 'Installation, service, EPA 608 required' },
          { title: 'Electrician Apprentice', note: 'Residential and commercial wiring' },
          { title: 'Plumber Apprentice', note: 'Residential and commercial plumbing' },
          { title: 'Welder', note: 'Structural, pipe, MIG/TIG' },
          { title: 'Machinist / CNC Operator', note: 'Precision manufacturing' },
          { title: 'Administrative Assistant', note: 'Office support, scheduling, data entry' },
          { title: 'Customer Service Rep', note: 'Call center, help desk' },
          { title: 'Barber / Cosmetologist', note: 'Licensed trade — state exam also required' },
        ],
      },
      {
        level: 'Gold',
        score: 'Level 6',
        color: 'yellow',
        jobs: [
          { title: 'Firefighter', note: 'Municipal fire departments — many require Gold NCRC or equivalent' },
          { title: 'Police Officer / Corrections Officer', note: 'Law enforcement entry — written exam also required' },
          { title: 'EMT / Paramedic', note: 'Emergency medical services' },
          { title: 'Surgical Technologist', note: 'Operating room support' },
          { title: 'Phlebotomist (CPT)', note: 'Clinical blood draw — NHA CPT exam also required' },
          { title: 'IT Support Specialist', note: 'Help desk, CompTIA A+ often paired' },
          { title: 'Bookkeeper / Accounting Clerk', note: 'QuickBooks, payroll, A/R, A/P' },
          { title: 'Logistics Coordinator', note: 'Supply chain, dispatch, inventory management' },
          { title: 'Construction Supervisor', note: 'Crew lead, site safety, scheduling' },
          { title: 'Insurance Claims Processor', note: 'Medical billing, coding support' },
        ],
      },
      {
        level: 'Platinum',
        score: 'Level 7',
        color: 'blue',
        jobs: [
          { title: 'Union Trades (Ironworker, Pipefitter, Boilermaker)', note: 'Many union apprenticeship programs require Platinum' },
          { title: 'Registered Nurse (RN)', note: 'NCLEX also required — Platinum demonstrates academic readiness' },
          { title: 'Dental Hygienist', note: 'State licensure also required' },
          { title: 'Network / Systems Administrator', note: 'IT infrastructure, server management' },
          { title: 'Engineering Technician', note: 'Civil, mechanical, electrical support roles' },
          { title: 'Financial Services Rep', note: 'Banking, insurance, Series 6/63 often paired' },
          { title: 'Project Manager (entry)', note: 'PMP or CAPM often pursued alongside' },
          { title: 'Technical Writer', note: 'Documentation, manuals, compliance writing' },
        ],
      },
    ],
  },
  // ServSafe removed from testing center — NRA administers its own exam delivery.
  // ServSafe credentials are earned through Elevate's culinary/food service programs,
  // not through the testing center. See /programs/culinary-apprenticeship.
  careersafe: {
    key: 'careersafe',
    name: 'CareerSafe / OSHA Outreach',
    capability: 'CENTER_REMOTE_ALLOWED',
    description: 'OSHA Outreach Training Program certifications issued through the U.S. Department of Labor. The OSHA 10 and OSHA 30 are the most widely recognized workplace safety credentials in the country. Required by many construction employers, union apprenticeship programs, and federal contractors. A DOL wallet card is issued upon completion — valid for life.',
    exams: [
      {
        name: 'OSHA 10-Hour — General Industry',
        description: 'Covers workplace safety fundamentals for non-construction environments — manufacturing, warehousing, healthcare, retail, and service industries. Topics include hazard recognition, electrical safety, PPE, fire safety, and OSHA rights. Required by many employers for entry-level workers. DOL wallet card issued.',
        durationMinutes: 600,
      },
      {
        name: 'OSHA 10-Hour — Construction',
        description: 'Covers construction site safety — fall protection, scaffolding, electrical hazards, struck-by and caught-in hazards, and OSHA standards for the construction industry. Required by many general contractors and union apprenticeship programs for all workers on site. DOL wallet card issued.',
        durationMinutes: 600,
      },
      {
        name: 'OSHA 30-Hour — General Industry',
        description: 'Advanced safety training for supervisors and workers with safety responsibilities in general industry. Covers all OSHA 10 topics in greater depth plus additional modules on ergonomics, machine guarding, hazardous materials, and safety program management. Required for safety officers and site supervisors in many industries.',
        durationMinutes: 1800,
      },
      {
        name: 'OSHA 30-Hour — Construction',
        description: 'Advanced construction safety training for foremen, supervisors, and safety personnel. Covers all OSHA 10-Construction topics plus excavation, cranes, rigging, concrete, steel erection, and safety program development. Required by many union trades and federal construction contracts.',
        durationMinutes: 1800,
      },
    ],
    verifyUrl: 'https://www.osha.gov/training/outreach',
    status: 'active',
    publicVisible: false, // not yet offered publicly — internal/partner use only
    fees: [
      { label: 'OSHA 10-Hour', amount: 65, note: 'Includes course + DOL card' },
      { label: 'OSHA 30-Hour', amount: 185, note: 'Includes course + DOL card' },
    ],
    ncrcJobProfiles: [
      {
        level: 'OSHA 10',
        score: 'Entry-Level Safety',
        color: 'amber',
        jobs: [
          { title: 'Construction Laborer', note: 'Required on most union and federal job sites' },
          { title: 'Warehouse Worker', note: 'Forklift, loading dock, hazmat handling' },
          { title: 'Manufacturing Technician', note: 'Machine operation, assembly lines' },
          { title: 'Electrician Apprentice', note: 'OSHA 10 required by most IBEW locals' },
          { title: 'Plumber / Pipefitter Apprentice', note: 'UA union apprenticeship requirement' },
        ],
      },
      {
        level: 'OSHA 30',
        score: 'Supervisory / Safety Roles',
        color: 'yellow',
        jobs: [
          { title: 'Construction Foreman / Superintendent', note: 'Site safety oversight, crew management' },
          { title: 'Safety Officer / EHS Coordinator', note: 'Environmental health and safety compliance' },
          { title: 'Union Journeyman (trades)', note: 'OSHA 30 required for journeyman status in many locals' },
          { title: 'Federal Contractor', note: 'Davis-Bacon and federal construction contracts often require OSHA 30' },
          { title: 'Plant / Facilities Manager', note: 'Manufacturing and industrial facility oversight' },
        ],
      },
    ],
  },
};

/**
 * Returns which proctoring modes are available for a given provider.
 * Use this to drive booking UI — only show options the provider actually supports.
 */
export function getProctoringOptions(providerKey: string): ProctoringOptions {
  const provider = CERT_PROVIDERS[providerKey];

  if (!provider) {
    // Unknown provider — default to in-person only (safest)
    return { inPerson: true, remoteProvider: false, remoteCenter: false };
  }

  switch (provider.capability) {
    case 'IN_PERSON_ONLY':
      return { inPerson: true, remoteProvider: false, remoteCenter: false };

    case 'IN_PERSON_OR_PROVIDER_REMOTE':
      return { inPerson: true, remoteProvider: true, remoteCenter: false };

    case 'CENTER_REMOTE_ALLOWED':
      return { inPerson: true, remoteProvider: false, remoteCenter: true };

    default:
      return { inPerson: true, remoteProvider: false, remoteCenter: false };
  }
}

/**
 * Returns human-readable labels for the available proctoring modes.
 * Use this to render booking option cards or dropdowns.
 */
export function getProctoringLabels(providerKey: string): string[] {
  const options = getProctoringOptions(providerKey);
  const labels: string[] = [];

  if (options.inPerson)       labels.push('In-person at Elevate Testing Center');
  if (options.remoteProvider) labels.push('Remote — provider-controlled system');
  if (options.remoteCenter)   labels.push('Live online — Elevate-proctored');

  return labels;
}

/**
 * Returns all active providers grouped by capability type.
 * Useful for admin dashboards and scheduling views.
 */
export function getProvidersByCapability(): Record<ProctoringCapability, CertProvider[]> {
  const grouped: Record<ProctoringCapability, CertProvider[]> = {
    IN_PERSON_ONLY: [],
    IN_PERSON_OR_PROVIDER_REMOTE: [],
    CENTER_REMOTE_ALLOWED: [],
  };

  for (const provider of Object.values(CERT_PROVIDERS)) {
    grouped[provider.capability].push(provider);
  }

  return grouped;
}

/** Active providers only — for public-facing pages */
export const ACTIVE_PROVIDERS = Object.values(CERT_PROVIDERS).filter(
  (p) => p.status === 'active' && p.publicVisible !== false
);

/** All providers — for admin/scheduling views */
export const ALL_PROVIDERS = Object.values(CERT_PROVIDERS);
