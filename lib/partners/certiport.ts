// lib/partners/certiport.ts
// Certiport (Pearson VUE) — Portal/Link-Based Integration
//
// Certiport does NOT have a public REST API.
// Exams are delivered via Compass testing software at authorized testing centers.
// Integration is link-based: students are directed to the Certiport portal,
// vouchers are purchased by admin, and results are recorded by proctors.
//
// Elevate for Humanity is a registered CATC (Certiport Authorized Testing Center).
// Location: 7009 E 56th St Ste F, Indianapolis, IN 46226
//
// Actual flow:
//   1. Admin purchases exam vouchers via Certiport portal
//   2. Voucher code is stored in our DB and assigned to student
//   3. Student arrives at testing center for proctored exam
//   4. Proctor launches Compass software on testing workstation
//   5. Student takes exam using voucher code
//   6. Results appear in Certiport portal (pass/fail + score)
//   7. Proctor/admin records result in our LMS via credential capture UI

export const CERTIPORT_PORTAL_URL = 'https://certiport.pearsonvue.com';
export const CERTIPORT_SUPPORT_URL = 'https://certiport.pearsonvue.com/Support';
export const CERTIPORT_CATC_URL = 'https://certiport.pearsonvue.com/Certifications/CATC';

export type CertiportExamStatus =
  | 'voucher_assigned'
  | 'scheduled'
  | 'in_progress'
  | 'passed'
  | 'failed'
  | 'expired'
  | 'cancelled';

export interface CertiportVoucher {
  voucherCode: string;
  examCode: string;
  examName: string;
  assignedTo: string; // student user ID
  assignedAt: string; // ISO date
  expiresAt: string;  // ISO date — vouchers expire
  status: CertiportExamStatus;
  score?: number;
  passingScore?: number;
  completedAt?: string;
  proctorId?: string;
  notes?: string;
}

/**
 * Available Certiport certification exams.
 * These are the exams Elevate is authorized to proctor as a CATC.
 */
export const CERTIPORT_EXAMS = {
  // Microsoft Office Specialist
  'MOS-WORD-ASSOC': { name: 'Microsoft Office Specialist: Word (Associate)', category: 'Microsoft Office', passingScore: 700 },
  'MOS-WORD-EXPERT': { name: 'Microsoft Office Specialist: Word (Expert)', category: 'Microsoft Office', passingScore: 700 },
  'MOS-EXCEL-ASSOC': { name: 'Microsoft Office Specialist: Excel (Associate)', category: 'Microsoft Office', passingScore: 700 },
  'MOS-EXCEL-EXPERT': { name: 'Microsoft Office Specialist: Excel (Expert)', category: 'Microsoft Office', passingScore: 700 },
  'MOS-POWERPOINT': { name: 'Microsoft Office Specialist: PowerPoint', category: 'Microsoft Office', passingScore: 700 },
  'MOS-OUTLOOK': { name: 'Microsoft Office Specialist: Outlook', category: 'Microsoft Office', passingScore: 700 },
  'MOS-ACCESS': { name: 'Microsoft Office Specialist: Access', category: 'Microsoft Office', passingScore: 700 },

  // IC3 Digital Literacy
  'IC3-COMPUTING': { name: 'IC3 Digital Literacy: Computing Fundamentals', category: 'Digital Literacy', passingScore: 700 },
  'IC3-APPS': { name: 'IC3 Digital Literacy: Key Applications', category: 'Digital Literacy', passingScore: 700 },
  'IC3-ONLINE': { name: 'IC3 Digital Literacy: Living Online', category: 'Digital Literacy', passingScore: 700 },

  // Entrepreneurship & Small Business
  'ESB': { name: 'Entrepreneurship and Small Business (ESB)', category: 'Business', passingScore: 700 },

  // IT Specialist
  'ITS-PYTHON': { name: 'IT Specialist: Python', category: 'IT', passingScore: 700 },
  'ITS-JAVA': { name: 'IT Specialist: Java', category: 'IT', passingScore: 700 },
  'ITS-HTML-CSS': { name: 'IT Specialist: HTML & CSS', category: 'IT', passingScore: 700 },
  'ITS-JAVASCRIPT': { name: 'IT Specialist: JavaScript', category: 'IT', passingScore: 700 },
  'ITS-NETWORKING': { name: 'IT Specialist: Networking', category: 'IT', passingScore: 700 },
  'ITS-CYBERSECURITY': { name: 'IT Specialist: Cybersecurity', category: 'IT', passingScore: 700 },

  // Intuit QuickBooks
  'QB-DESKTOP': { name: 'Intuit QuickBooks Certified User: Desktop', category: 'Business', passingScore: 700 },
  'QB-ONLINE': { name: 'Intuit QuickBooks Certified User: Online', category: 'Business', passingScore: 700 },
} as const;

export type CertiportExamCode = keyof typeof CERTIPORT_EXAMS;

/**
 * Returns the Certiport portal link.
 * This is the only "integration" — a link to the portal where
 * admins manage vouchers and view results.
 */
export function getCertiportPortalLink(): string {
  return CERTIPORT_PORTAL_URL;
}

/**
 * Get exam details by code.
 */
export function getExamDetails(examCode: CertiportExamCode) {
  return CERTIPORT_EXAMS[examCode] || null;
}

/**
 * Get all exams for a category (e.g., 'Microsoft Office', 'IT', 'Business').
 */
export function getExamsByCategory(category: string) {
  return Object.entries(CERTIPORT_EXAMS)
    .filter(([, exam]) => exam.category === category)
    .map(([code, exam]) => ({ code, ...exam }));
}

/**
 * Get all available exam categories.
 */
export function getExamCategories(): string[] {
  const categories = new Set(
    Object.values(CERTIPORT_EXAMS).map((exam) => exam.category)
  );
  return Array.from(categories).sort();
}
