export type RegistryCredentialType =
  | 'Certificate'
  | 'Certification'
  | 'Diploma'
  | 'Degree'
  | 'Badge'
  | 'License';

export type RegistryDeliveryType = 'In Person' | 'Online Only' | 'Hybrid';

export interface CredentialRegistryRecord {
  /** Stable CTID returned/generated for this credential. Preserve it for updates and deletion. */
  ctid: string;
  /** CTID of Elevate's separately published Organization record. */
  organizationCtid: string;
  registryEnvironment: 'sandbox' | 'production';
  lastPublishedAt: string;
  credentialName: string;
  credentialType: RegistryCredentialType | '';
  description: string;
  subjectWebpage: string;
  credentialStatus: 'Active' | 'Deprecated' | 'Suspended' | '';
  owningOrganization: string;
  offeredBy: string;
  language: string;
  durationHours: number | null;
  durationWeeks: number | null;
  deliveryType: RegistryDeliveryType | '';
  entryRequirements: string;
  assessmentRequirements: string;
  completionRequirements: string;
  estimatedCost: number | null;
  costCurrency: string;
  financialAssistance: string;
  competencies: string[];
  occupations: string[];
  industryCodes: string[];
  approvalAgency: string;
  approvalIdentifier: string;
  approvalEffectiveDate: string;
  approvalExpirationDate: string;
};

export interface RegistryValidation {
  ready: boolean;
  completionPercent: number;
  missing: string[];
  warnings: string[];
}

export const EMPTY_CREDENTIAL_REGISTRY_RECORD: CredentialRegistryRecord = {
  ctid: '',
  organizationCtid: '',
  registryEnvironment: 'production',
  lastPublishedAt: '',
  credentialName: '',
  credentialType: '',
  description: '',
  subjectWebpage: '',
  credentialStatus: 'Active',
  owningOrganization: 'Elevate for Humanity Career & Technical Institute',
  offeredBy: 'Elevate for Humanity Career & Technical Institute',
  language: 'en',
  durationHours: null,
  durationWeeks: null,
  deliveryType: '',
  entryRequirements: '',
  assessmentRequirements: '',
  completionRequirements: '',
  estimatedCost: null,
  costCurrency: 'USD',
  financialAssistance: '',
  competencies: [],
  occupations: [],
  industryCodes: [],
  approvalAgency: '',
  approvalIdentifier: '',
  approvalEffectiveDate: '',
  approvalExpirationDate: '',
};

const REQUIRED: Array<[keyof CredentialRegistryRecord, string]> = [
  ['credentialName', 'Credential name'],
  ['credentialType', 'Credential type'],
  ['description', 'Credential description'],
  ['subjectWebpage', 'Credential-specific public webpage'],
  ['credentialStatus', 'Credential status'],
  ['owningOrganization', 'Owning organization'],
  ['offeredBy', 'Offering organization'],
  ['language', 'Language'],
];

export function validateCredentialRegistryRecord(
  record: CredentialRegistryRecord,
): RegistryValidation {
  const missing = REQUIRED.filter(([key]) => {
    const value = record[key];
    return value === null || value === '' || (Array.isArray(value) && value.length === 0);
  }).map(([, label]) => label);

  if (!record.durationHours && !record.durationWeeks) {
    missing.push('Program duration (hours or weeks)');
  }
  if (!record.deliveryType) missing.push('Delivery type');
  if (!record.entryRequirements.trim()) missing.push('Entry requirements');
  if (!record.assessmentRequirements.trim()) missing.push('Assessment requirements');
  if (!record.completionRequirements.trim()) missing.push('Completion requirements');
  if (!record.competencies.length) missing.push('Skills and competencies');
  if (!record.occupations.length) missing.push('Related occupations');

  const warnings: string[] = [];
  const ctidPattern = /^ce-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (record.ctid && !ctidPattern.test(record.ctid)) {
    warnings.push('Credential CTID must use the ce-UUID format.');
  }
  if (record.organizationCtid && !ctidPattern.test(record.organizationCtid)) {
    warnings.push('Organization CTID must use the ce-UUID format.');
  }
  if (!record.organizationCtid) {
    warnings.push('Add Elevate’s published Organization CTID before linking production records.');
  }
  if (!record.ctid) {
    warnings.push('For a new credential, generate or capture its CTID and preserve it before future updates.');
  }
  if (record.description.trim().length > 0 && record.description.trim().length < 100) {
    warnings.push('Credential description should be at least 100 characters for useful comparison.');
  }
  if (record.subjectWebpage && !/^https:\/\//i.test(record.subjectWebpage)) {
    warnings.push('Subject webpage should be a public HTTPS URL.');
  }
  if (record.estimatedCost === null) {
    warnings.push('Add tuition and fees when available.');
  }
  if ((record.approvalAgency && !record.approvalIdentifier) ||
      (!record.approvalAgency && record.approvalIdentifier)) {
    warnings.push('Approval agency and approval identifier should be supplied together.');
  }

  const total = REQUIRED.length + 7;
  const completionPercent = Math.max(
    0,
    Math.round(((total - Math.min(missing.length, total)) / total) * 100),
  );

  return { ready: missing.length === 0, completionPercent, missing, warnings };
}

const CSV_COLUMNS: Array<[string, keyof CredentialRegistryRecord]> = [
  ['CTID', 'ctid'],
  ['Organization CTID', 'organizationCtid'],
  ['Registry Environment', 'registryEnvironment'],
  ['Last Published At', 'lastPublishedAt'],
  ['Credential Name', 'credentialName'],
  ['Credential Type', 'credentialType'],
  ['Credential Description', 'description'],
  ['Subject Webpage', 'subjectWebpage'],
  ['Credential Status', 'credentialStatus'],
  ['Owning Organization', 'owningOrganization'],
  ['Offered By', 'offeredBy'],
  ['Language', 'language'],
  ['Duration Hours', 'durationHours'],
  ['Duration Weeks', 'durationWeeks'],
  ['Delivery Type', 'deliveryType'],
  ['Entry Requirements', 'entryRequirements'],
  ['Assessment Requirements', 'assessmentRequirements'],
  ['Completion Requirements', 'completionRequirements'],
  ['Estimated Cost', 'estimatedCost'],
  ['Cost Currency', 'costCurrency'],
  ['Financial Assistance', 'financialAssistance'],
  ['Competencies', 'competencies'],
  ['Related Occupations', 'occupations'],
  ['Industry Codes', 'industryCodes'],
  ['Approval Agency', 'approvalAgency'],
  ['Approval Identifier', 'approvalIdentifier'],
  ['Approval Effective Date', 'approvalEffectiveDate'],
  ['Approval Expiration Date', 'approvalExpirationDate'],
];

function csvCell(value: unknown): string {
  const normalized = Array.isArray(value) ? value.join('|') : value == null ? '' : String(value);
  return `"${normalized.replace(/"/g, '""')}"`;
}

export function toCredentialRegistryCsv(records: CredentialRegistryRecord[]): string {
  const header = CSV_COLUMNS.map(([label]) => csvCell(label)).join(',');
  const rows = records.map((record) =>
    CSV_COLUMNS.map(([, key]) => csvCell(record[key])).join(','),
  );
  return [header, ...rows].join('\r\n');
}


export function credentialRegistryResourceUri(ctid: string): string | null {
  if (!ctid) return null;
  const normalized = ctid.trim();
  if (!/^ce-[0-9a-f-]{36}$/i.test(normalized)) return null;
  return `https://credentialengineregistry.org/resources/${normalized}`;
}
