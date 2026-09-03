/**
 * PARIS Licensing Platform
 * 
 * Every course is automatically licensed and versioned.
 * Stores in database for school management.
 */

export interface CurriculumLicense {
  id: string;
  curriculumId: string;
  curriculumName: string;
  version: string;
  copyright: string;
  licenseType: LicenseType;
  schoolId?: string;
  schoolName?: string;
  issuedAt: string;
  expiresAt: string;
  autoRenew: boolean;
  maintenanceIncluded: boolean;
  updateChannel: 'standard' | 'premium' | 'beta';
  entitlements: LicenseEntitlements;
  restrictions: LicenseRestrictions;
  status: 'active' | 'expired' | 'pending' | 'cancelled';
  renewalEligible: boolean;
  renewalDiscount: number;
}

export interface LicenseEntitlements {
  studentSeats: number | 'unlimited';
  instructorAccounts: number;
  adminAccounts: number;
  apiAccess: boolean;
  customBranding: boolean;
  supportLevel: 'email' | 'phone' | 'priority' | 'dedicated';
}

export interface LicenseRestrictions {
  modifyContent: boolean;
  resell: boolean;
  sublicense: boolean;
  transfer: boolean;
}

export interface LicenseType {
  name: string;
  durationMonths: number;
  pricePerStudent: number;
  minimumStudents: number;
  annualMaintenanceFee: number;
}

export interface LicenseChange {
  id: string;
  licenseId: string;
  changeType: 'version' | 'renewal' | 'upgrade' | 'downgrade' | 'cancellation';
  oldValue?: string;
  newValue?: string;
  changedAt: string;
  changedBy: string;
}

export interface SchoolLicense {
  id: string;
  schoolId: string;
  schoolName: string;
  schoolEmail: string;
  licenses: CurriculumLicense[];
  totalStudents: number;
  totalSpend: number;
  renewalDate: string;
  accountManager?: string;
}

/**
 * Generate curriculum license
 */
export function generateCurriculumLicense(params: {
  curriculumId: string;
  curriculumName: string;
  schoolId?: string;
  schoolName?: string;
  licenseType: LicenseType;
  studentSeats: number | 'unlimited';
}): CurriculumLicense {
  const now = new Date();
  const expires = new Date(now);
  expires.setMonth(expires.getMonth() + params.licenseType.durationMonths);

  const id = `lic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const version = `v${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}`;

  return {
    id,
    curriculumId: params.curriculumId,
    curriculumName: params.curriculumName,
    version,
    copyright: `© ${now.getFullYear()} Elevate for Humanity`,
    licenseType: params.licenseType.name,
    schoolId: params.schoolId,
    schoolName: params.schoolName,
    issuedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    autoRenew: true,
    maintenanceIncluded: true,
    updateChannel: 'standard',
    entitlements: {
      studentSeats: params.studentSeats,
      instructorAccounts: 5,
      adminAccounts: 2,
      apiAccess: params.licenseType.name.includes('Enterprise'),
      customBranding: params.licenseType.name.includes('Enterprise'),
      supportLevel: params.licenseType.name.includes('Enterprise') ? 'priority' : 'email',
    },
    restrictions: {
      modifyContent: false,
      resell: false,
      sublicense: false,
      transfer: false,
    },
    status: 'active',
    renewalEligible: true,
    renewalDiscount: 0.1, // 10% discount
  };
}

/**
 * Calculate license price
 */
export function calculateLicensePrice(params: {
  licenseType: LicenseType;
  studentSeats: number;
}): { subtotal: number; maintenance: number; total: number } {
  const minSeats = params.licenseType.minimumStudents;
  const actualSeats = Math.max(params.studentSeats, minSeats);

  const subtotal = actualSeats * params.licenseType.pricePerStudent;
  const maintenance = params.licenseType.annualMaintenanceFee;

  return {
    subtotal,
    maintenance,
    total: subtotal + maintenance,
  };
}

/**
 * Get license types
 */
export const LICENSE_TYPES: LicenseType[] = [
  {
    name: 'Standard',
    durationMonths: 12,
    pricePerStudent: 25,
    minimumStudents: 10,
    annualMaintenanceFee: 500,
  },
  {
    name: 'Professional',
    durationMonths: 12,
    pricePerStudent: 20,
    minimumStudents: 25,
    annualMaintenanceFee: 1000,
  },
  {
    name: 'Enterprise',
    durationMonths: 12,
    pricePerStudent: 15,
    minimumStudents: 100,
    annualMaintenanceFee: 5000,
  },
];

/**
 * Generate curriculum metadata (for database storage)
 */
export function generateCurriculumMetadata(params: {
  curriculumId: string;
  courseName: string;
  credentialSlug: string;
  provider: string;
  category: string;
}): CurriculumMetadata {
  const now = new Date();

  return {
    id: params.curriculumId,
    slug: params.curriculumId,
    name: params.courseName,
    credentialSlug: params.credentialSlug,
    provider: params.provider,
    category: params.category,
    version: `v${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}`,
    copyright: `© ${now.getFullYear()} Elevate for Humanity. All Rights Reserved.`,
    allRightsReserved: true,
    licenseRequired: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    status: 'published',
    productionReady: true,
    qualityScore: 0, // Will be updated after QA
    readinessReport: null,
    wioaEligible: true,
    etplApproved: false,
    accredited: false,
    credentials: [],
    standards: [],
    competencies: [],
    learningObjectives: [],
    assessments: [],
    mediaAssets: [],
    changeLog: [
      {
        version: `v${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}`,
        date: now.toISOString(),
        changes: ['Initial release'],
        author: 'PARIS AI',
      },
    ],
    schools: [],
    totalEnrollments: 0,
    averageCompletion: 0,
    averageSatisfaction: 0,
    renewalDue: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString(),
  };
}

export interface CurriculumMetadata {
  id: string;
  slug: string;
  name: string;
  credentialSlug: string;
  provider: string;
  category: string;
  version: string;
  copyright: string;
  allRightsReserved: boolean;
  licenseRequired: boolean;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'review' | 'published' | 'archived';
  productionReady: boolean;
  qualityScore: number;
  readinessReport: string | null;
  wioaEligible: boolean;
  etplApproved: boolean;
  accredited: boolean;
  credentials: string[];
  standards: string[];
  competencies: string[];
  learningObjectives: string[];
  assessments: string[];
  mediaAssets: string[];
  changeLog: ChangeLogEntry[];
  schools: string[];
  totalEnrollments: number;
  averageCompletion: number;
  averageSatisfaction: number;
  renewalDue: string;
}

export interface ChangeLogEntry {
  version: string;
  date: string;
  changes: string[];
  author: string;
}

/**
 * Check if license renewal is due
 */
export function isRenewalDue(license: CurriculumLicense): boolean {
  const expires = new Date(license.expiresAt);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry <= 30;
}

/**
 * Get schools with expiring licenses
 */
export function getExpiringLicenses(licenses: CurriculumLicense[], daysThreshold = 30): CurriculumLicense[] {
  return licenses.filter(license => {
    const expires = new Date(license.expiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= daysThreshold && license.status === 'active';
  });
}

/**
 * Generate renewal quote
 */
export function generateRenewalQuote(license: CurriculumLicense): RenewalQuote {
  const basePrice = calculateLicensePrice({
    licenseType: { name: license.licenseType, durationMonths: 12, pricePerStudent: 25, minimumStudents: 10, annualMaintenanceFee: 500 },
    studentSeats: license.entitlements.studentSeats === 'unlimited' ? 100 : license.entitlements.studentSeats,
  });

  const discount = license.renewalEligible ? basePrice.total * license.renewalDiscount : 0;

  return {
    licenseId: license.id,
    curriculumName: license.curriculumName,
    currentSeats: license.entitlements.studentSeats,
    subtotal: basePrice.total,
    discount,
    total: basePrice.total - discount,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    autoRenew: license.autoRenew,
  };
}

export interface RenewalQuote {
  licenseId: string;
  curriculumName: string;
  currentSeats: number | 'unlimited';
  subtotal: number;
  discount: number;
  total: number;
  validUntil: string;
  autoRenew: boolean;
}

/**
 * Record license change
 */
export function recordLicenseChange(params: {
  licenseId: string;
  changeType: 'version' | 'renewal' | 'upgrade' | 'downgrade' | 'cancellation';
  oldValue?: string;
  newValue?: string;
  changedBy: string;
}): LicenseChange {
  return {
    id: `chg-${Date.now()}`,
    licenseId: params.licenseId,
    changeType: params.changeType,
    oldValue: params.oldValue,
    newValue: params.newValue,
    changedAt: new Date().toISOString(),
    changedBy: params.changedBy,
  };
}
