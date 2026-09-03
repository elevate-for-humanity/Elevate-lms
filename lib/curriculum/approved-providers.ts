import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
/**
 * lib/curriculum/approved-providers.ts
 *
 * Approved content provider registry.
 *
 * The AI pathway orchestrator may ONLY assemble content from providers
 * listed here. This is the institutional guardrail — it prevents the AI
 * from pulling in unvetted, low-quality, or non-compliant content sources.
 *
 * Adding a provider here is a deliberate institutional decision.
 * Each provider must have:
 *   - A documented content quality standard
 *   - A known credential alignment (or explicit "no credential" flag)
 *   - A fetch strategy (API, scrape, manual import, or static catalog)
 *   - An approved use scope (which program categories it may be used for)
 */

export type ProviderFetchStrategy =
  | 'public_api'
  | 'api_key'
  | 'oauth'
  | 'static_catalog'
  | 'manual_import';

export type ContentLicense =
  | 'cc_by'
  | 'cc_by_sa'
  | 'cc_by_nc'
  | 'free_to_use'
  | 'licensed'
  | 'proprietary';

export interface ApprovedProvider {
  id: string;
  name: string;
  url: string;
  description: string;
  fetchStrategy: ProviderFetchStrategy;
  license: ContentLicense;
  approvedCategories: string[];
  certiportExamCodes?: string[];
  countsForComplianceHours: boolean;
  wioaEligible: boolean;
  apiBase?: string;
  apiKeyEnvVar?: string;
  active: boolean;
  notes?: string;
}

export const APPROVED_PROVIDERS: Record<string, ApprovedProvider> = {
  'microsoft-learn': {
    id: 'microsoft-learn',
    name: 'Microsoft Learn',
    url: 'https://learn.microsoft.com',
    description: 'Free Microsoft-authored training modules for Office, Azure, and IT certifications.',
    fetchStrategy: 'public_api',
    license: 'free_to_use',
    approvedCategories: ['technology', 'it-help-desk', 'cybersecurity', 'cloud', 'office-productivity', 'finance-bookkeeping-accounting'],
    certiportExamCodes: ['MOS-WORD-ASSOC', 'MOS-WORD-EXPERT', 'MOS-EXCEL-ASSOC', 'MOS-EXCEL-EXPERT', 'MOS-POWERPOINT', 'MOS-OUTLOOK', 'MOS-ACCESS', 'MTA-NETWORKING', 'MTA-SECURITY', 'MTA-WINDOWS-OS', 'MTA-CLOUD', 'IC3-GS6', 'AZ-900', 'SC-900'],
    countsForComplianceHours: false,
    wioaEligible: true,
    apiBase: 'https://learn.microsoft.com/api/catalog',
    active: true,
    notes: 'Public catalog API. No key required. Cache 24h. Use for IT, Office, and Azure programs.',
  },

  'ibm-skillsbuild': {
    id: 'ibm-skillsbuild',
    name: 'IBM SkillsBuild',
    url: 'https://skillsbuild.org',
    description: 'IBM free workforce development content: AI, cybersecurity, cloud, data science, and professional skills.',
    fetchStrategy: 'static_catalog',
    license: 'free_to_use',
    approvedCategories: ['technology', 'cybersecurity', 'data-analytics', 'ai-digital-literacy', 'cloud', 'professional-development'],
    countsForComplianceHours: false,
    wioaEligible: true,
    active: true,
    notes: 'No public API. Use static catalog. Strong for AI literacy and workforce readiness modules.',
  },

  certiport: {
    id: 'certiport',
    name: 'Certiport / Pearson VUE',
    url: 'https://certiport.pearsonvue.com',
    description: 'Industry certification exams: MOS, MTA, IC3, CompTIA, Adobe, QuickBooks. Elevate is a registered CATC.',
    fetchStrategy: 'static_catalog',
    license: 'licensed',
    approvedCategories: ['technology', 'it-help-desk', 'office-productivity', 'finance-bookkeeping-accounting', 'graphic-design'],
    certiportExamCodes: ['MOS-WORD-ASSOC', 'MOS-EXCEL-ASSOC', 'MOS-POWERPOINT', 'IC3-GS6', 'COMPTIA-IT-SPEC'],
    countsForComplianceHours: false,
    wioaEligible: true,
    active: true,
    notes: 'Exam objectives are the authoritative content source. Elevate is CATC — students test on-site.',
  },

  onet: {
    id: 'onet',
    name: 'O*NET OnLine (DOL)',
    url: 'https://www.onetonline.org',
    description: 'US Department of Labor occupational data: skills, tasks, wages, and workforce outcomes by SOC code.',
    fetchStrategy: 'public_api',
    license: 'cc_by',
    approvedCategories: ['*'],
    countsForComplianceHours: false,
    wioaEligible: true,
    apiBase: 'https://services.onetcenter.org/ws',
    apiKeyEnvVar: 'ONET_API_KEY',
    active: true,
    notes: 'Use for workforce outcome alignment on all programs. Free API with registration.',
  },

  'indiana-etpl': {
    id: 'indiana-etpl',
    name: 'Indiana ETPL',
    url: 'https://www.in.gov/dwd/etpl',
    description: 'Indiana Eligible Training Provider List — approved programs for WIOA-funded training.',
    fetchStrategy: 'manual_import',
    license: 'free_to_use',
    approvedCategories: ['*'],
    countsForComplianceHours: true,
    wioaEligible: true,
    active: true,
    notes: 'Elevate programs must be on ETPL for WIOA funding. Manual import from DWD portal.',
  },

  'elevate-proprietary': {
    id: 'elevate-proprietary',
    name: 'Elevate for Humanity (Proprietary)',
    url: PLATFORM_DEFAULTS.siteUrl,
    description: 'Elevate-authored curriculum: HVAC, Barber, CNA, PRS, and other proprietary programs.',
    fetchStrategy: 'static_catalog',
    license: 'proprietary',
    approvedCategories: ['*'],
    countsForComplianceHours: true,
    wioaEligible: true,
    active: true,
    notes: 'Stored in curriculum_lessons and blueprints. Always takes priority over external content.',
  },
};

export function getApprovedProvidersForCategory(category: string): ApprovedProvider[] {
  return Object.values(APPROVED_PROVIDERS).filter(
    (p) => p.active && (p.approvedCategories.includes('*') || p.approvedCategories.includes(category)),
  );
}

export function getProvidersForExam(examCode: string): ApprovedProvider[] {
  return Object.values(APPROVED_PROVIDERS).filter(
    (p) => p.active && p.certiportExamCodes?.includes(examCode),
  );
}

export function buildProviderConstraintPrompt(category: string): string {
  const providers = getApprovedProvidersForCategory(category);
  const list = providers.map((p) => `- ${p.name}: ${p.description}`).join('\n');
  return `
## Approved Content Sources

You may ONLY reference or recommend content from these approved providers.
Do not suggest, generate, or reference content from any other source.

${list}

Any lesson content, module structure, or learning objective you generate must
be traceable to one of these approved sources or to Elevate's proprietary curriculum.
`.trim();
}
