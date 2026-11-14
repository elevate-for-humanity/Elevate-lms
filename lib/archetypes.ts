// lib/archetypes.ts
export type ArchetypeKey =
  | 'program_training_detail'
  | 'application_enrollment_flow'
  | 'dashboard_portal'
  | 'directory_listing_search'
  | 'policy_compliance_legal'
  | 'partner_employer_agency'
  | 'auth_account_profile'
  | 'reporting_admin_ops'
  | 'marketing_informational'
  | 'system_utility_error';

export type ArchetypeRule = {
  key: ArchetypeKey;
  label: string;

  // Required content contracts enforced by the mapper.
  requiredSections: Array<
    | 'hero'
    | 'purpose'
    | 'primary_cta'
    | 'secondary_cta'
    | 'core_sections'
    | 'metadata'
    | 'accessibility'
  >;

  // Used to compute metadata deterministically, but still unique.
  metadataPrefix: string;

  // Route patterns that should map to this archetype.
  // Keep these explicit and tight.
  routeMatchers: Array<RegExp>;

  // Special enforcement for protected areas (dashboards/portals/admin).
  requiresServerAuth?: boolean;
  requiresRoleGate?: boolean;

  // Optional: if there are sections that must be present for this archetype.
  mustIncludeTokens?: string[]; // tokens expected to appear in page source (heuristic)
};

export const ARCHETYPES: Record<ArchetypeKey, ArchetypeRule> = {
  program_training_detail: {
    key: 'program_training_detail',
    label: 'Program / Training Detail',
    requiredSections: [
      'hero',
      'purpose',
      'primary_cta',
      'core_sections',
      'metadata',
      'accessibility',
    ],
    metadataPrefix: 'Program',
    routeMatchers: [/^\/programs(\/.*)?$/],
    mustIncludeTokens: ['Eligibility', 'Outcomes', 'How it works'],
  },

  application_enrollment_flow: {
    key: 'application_enrollment_flow',
    label: 'Application / Enrollment Flow',
    requiredSections: [
      'hero',
      'purpose',
      'primary_cta',
      'core_sections',
      'metadata',
      'accessibility',
    ],
    metadataPrefix: 'Apply',
    routeMatchers: [/^\/apply(\/.*)?$/, /^\/enroll(\/.*)?$/],
    mustIncludeTokens: ['Required information', 'Submission', 'Next steps'],
  },

  dashboard_portal: {
    key: 'dashboard_portal',
    label: 'Dashboard / Portal',
    requiredSections: [
      'hero',
      'purpose',
      'primary_cta',
      'core_sections',
      'metadata',
      'accessibility',
    ],
    metadataPrefix: 'Dashboard',
    routeMatchers: [/^\/dashboard(\/.*)?$/, /^\/portals?(\/.*)?$/],
    requiresServerAuth: true,
    requiresRoleGate: true,
    mustIncludeTokens: ['Your next step', 'Status', 'Actions'],
  },

  directory_listing_search: {
    key: 'directory_listing_search',
    label: 'Directory / Listing / Search',
    requiredSections: [
      'hero',
      'purpose',
      'primary_cta',
      'core_sections',
      'metadata',
      'accessibility',
    ],
    metadataPrefix: 'Directory',
    routeMatchers: [/^\/directory(\/.*)?$/, /^\/search(\/.*)?$/],
    mustIncludeTokens: ['Filters', 'Results'],
  },

  policy_compliance_legal: {
    key: 'policy_compliance_legal',
    label: 'Policy / Compliance / Legal',
    requiredSections: ['hero', 'purpose', 'core_sections', 'metadata', 'accessibility'],
    metadataPrefix: 'Policy',
    routeMatchers: [/^\/policies(\/.*)?$/, /^\/legal(\/.*)?$/, /^\/privacy$/, /^\/terms$/],
    mustIncludeTokens: ['Effective date', 'Contact'],
  },

  partner_employer_agency: {
    key: 'partner_employer_agency',
    label: 'Partner / Employer / Agency',
    requiredSections: [
      'hero',
      'purpose',
      'primary_cta',
      'core_sections',
      'metadata',
      'accessibility',
    ],
    metadataPrefix: 'Partners',
    routeMatchers: [/^\/partners(\/.*)?$/, /^\/employers(\/.*)?$/, /^\/agencies(\/.*)?$/],
    mustIncludeTokens: ['Partnership', 'Request', 'Contact'],
  },

  auth_account_profile: {
    key: 'auth_account_profile',
    label: 'Auth / Account / Profile',
    requiredSections: ['purpose', 'core_sections', 'metadata', 'accessibility'],
    metadataPrefix: 'Account',
    routeMatchers: [
      /^\/login$/,
      /^\/signup$/,
      /^\/register$/,
      /^\/account(\/.*)?$/,
      /^\/profile(\/.*)?$/,
    ],
  },

  reporting_admin_ops: {
    key: 'reporting_admin_ops',
    label: 'Reporting / Admin / Ops',
    requiredSections: ['hero', 'purpose', 'core_sections', 'metadata', 'accessibility'],
    metadataPrefix: 'Admin',
    routeMatchers: [/^\/admin(\/.*)?$/, /^\/ops(\/.*)?$/, /^\/reports?(\/.*)?$/],
    requiresServerAuth: true,
    requiresRoleGate: true,
    mustIncludeTokens: ['Export', 'Audit', 'Filters'],
  },

  marketing_informational: {
    key: 'marketing_informational',
    label: 'Marketing / Informational',
    requiredSections: [
      'hero',
      'purpose',
      'primary_cta',
      'core_sections',
      'metadata',
      'accessibility',
    ],
    metadataPrefix: 'Info',
    routeMatchers: [/^\/$/, /^\/about$/, /^\/contact$/, /^\/impact$/, /^\/donate$/],
  },

  system_utility_error: {
    key: 'system_utility_error',
    label: 'System / Utility / Error States',
    requiredSections: ['purpose', 'core_sections', 'metadata', 'accessibility'],
    metadataPrefix: 'System',
    routeMatchers: [/^\/sitemap\.xml$/, /^\/robots\.txt$/, /^\/404$/, /^\/500$/, /^\/status$/],
  },
};

// Forbidden phrases anywhere in UI/copy/metadata.
// Enforces operational, audit-safe language for workforce/government platform.
export const FORBIDDEN_PHRASES: string[] = [
  // A. Absolute Bans (Hard Fail)
  'Available Now',
  'under development',
  'Completed',
  'tbd',
  'to be determined',
  'Content',
  'lorem ipsum',
  'sample content',
  'example content',
  'beta feature',
  'future release',
  'planned feature',
  'not yet available',
  'stay tuned',

  // B. Vague Marketing Language (Fail Unless Contextualized)
  'learn more',
  'get started',
  'empowering communities',
  'supporting your journey',
  'making an impact',
  'transforming lives',
  'holistic approach',
  'innovative solutions',
  'cutting-edge',
  'best-in-class',
  'world-class',
  'seamless experience',
  'next-generation',

  // C. Dishonest Future-Tense Language (Hard Fail)
  'will be added',
  'will allow users to',
  'will enable',
  'will support',
  'will include',
  'is planned to',
  'is expected to',

  // D. Fake Completeness Signals (Context Required)
  // Note: These are allowed only if followed by concrete explanation
  // Enforced via manual review for now

  // E. Dashboard-Specific Red Flags (Immediate Reject)
  'no data yet',
  'nothing to see here',
  'check back later',
  'data Available Now',
  'dashboard preview',
  'demo data',
  'example stats',
];

// One-sentence enforcement rule:
// "Any phrase that could appear on a generic nonprofit website is forbidden here
// unless it explains a real action, rule, or outcome."
