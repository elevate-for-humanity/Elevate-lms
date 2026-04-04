/**
 * Canonical org profile for grant application auto-fill.
 * Single source of truth — update here, all application assistants reflect it.
 */

export const ORG_PROFILE = {
  // ── Legal Identity ──────────────────────────────────────────────────────────
  legalName: '2Exclusive LLC-S',
  dba: 'Elevate for Humanity Technical and Career Institute',
  fullName: '2Exclusive LLC-S (DBA: Elevate for Humanity Technical and Career Institute)',
  orgType: 'Nonprofit / LLC',
  ein: 'Available upon request',
  uei: 'VX2GK5S8SZH8',
  cageCode: '0QH19',
  samExpiration: 'June 29, 2026',
  dunsOrUei: 'UEI: VX2GK5S8SZH8',

  // ── Contact ─────────────────────────────────────────────────────────────────
  address: '8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240',
  city: 'Indianapolis',
  state: 'Indiana',
  zip: '46240',
  phone: '(317) 314-3757',
  email: 'elevate4humanityedu@gmail.com',
  website: 'https://www.elevateforhumanity.org',

  // ── Leadership ──────────────────────────────────────────────────────────────
  primaryContact: 'Elizabeth Greene',
  primaryTitle: 'Founder & Chief Executive Officer',
  primaryContactFull: 'Elizabeth Greene, Founder & Chief Executive Officer',
  financialContact: 'Dr. Carlina Wilkes, Executive Director of Financial Operations & Organizational Compliance',

  // ── Credentials & Registrations ─────────────────────────────────────────────
  dolSponsor: 'DOL Registered Apprenticeship Sponsor (RAPIDS: 2025-IN-132301)',
  etpl: 'ETPL listed provider',
  funding: 'WRG, WIOA, and JRI approved',
  partners: 'WorkOne partner, EmployIndy partner, Job Ready Indy partner, HSI affiliate',
  certifications: 'CareerSafe OSHA provider, NRF Rise Up provider, Certiport CATC',
  federal: 'SAM.gov registered (CAGE: 0QH19, UEI: VX2GK5S8SZH8), active federal government contractor',
  byblack: 'ByBlack certified (U.S. Black Chambers / NAACP)',
  samStatus: 'Active — registered bidder with the State of Indiana',

  // ── Employer Partners ───────────────────────────────────────────────────────
  employerPartners: [
    {
      name: 'Selfish Inc.',
      type: '501(c)(3) nonprofit',
      location: 'Indianapolis, Indiana',
      cageCode: '0Q856',
      role: 'Registered employer partner actively participating in apprenticeship programs',
    },
  ],

  // ── Programs ────────────────────────────────────────────────────────────────
  programs: [
    'Barber Apprenticeship (DOL Registered)',
    'HVAC & EPA 608 Certification',
    'Healthcare (CNA/QMA)',
    'Certified Peer Recovery Specialist (CPRS)',
    'CDL Training',
    'Digital Skills',
    'Leadership Development',
    'Drug Testing Business',
  ],

  targetPopulation: 'Justice-involved individuals, veterans, low-income adults, career changers, and underserved communities in Central Indiana',
  serviceArea: 'Marion County and surrounding Central Indiana counties',
  yearsOperating: 'Active since 2020',

  // ── Narrative Bank ──────────────────────────────────────────────────────────
  mission: 'Elevate for Humanity connects Hoosiers to funded career training, registered apprenticeships, and industry credentials — removing barriers so every person can access a sustainable career pathway.',

  capabilityStatement: '2Exclusive LLC-S (DBA: Elevate for Humanity Technical and Career Institute) is a DOL Registered Apprenticeship Sponsor, ETPL provider, and WRG/WIOA/JRI approved training organization based in Indianapolis, Indiana. We deliver workforce training, registered apprenticeships, and industry credentialing to justice-involved individuals, veterans, low-income adults, and career changers. Our infrastructure includes participant documentation, data reporting, grant compliance, and active partnerships with WorkOne, EmployIndy, and the Indiana Department of Workforce Development.',

  statementOfNeed: 'Indiana faces persistent workforce shortages in skilled trades, healthcare, education, and advanced manufacturing. Underserved populations in Marion County — including justice-involved individuals, veterans, and low-income adults — lack access to structured, earn-while-you-learn pathways. Elevate for Humanity addresses this gap through registered apprenticeships and pre-apprenticeship programs that combine on-the-job learning with related technical instruction, wraparound case management, and industry-recognized credentials.',

  outcomesStatement: 'Program graduates achieve industry-recognized credentials, living-wage employment, and long-term career advancement. Elevate maintains an active job placement network and tracks participant outcomes through Indiana Career Connect and RAPIDS per federal reporting requirements.',

  complianceStatement: 'All participants are entered into Indiana Career Connect and RAPIDS within 30 days of enrollment. Quarterly financial and outcome reports are submitted within 15 days of each quarter end using agency-provided templates. All records are maintained in audit-ready format per DWD-WBLA requirements.',
};

// ── Field Matching Engine ────────────────────────────────────────────────────
// Maps common grant form field labels to org profile answers.
// Add new patterns as new forms are encountered.

export type FieldMatch = {
  value: string;
  confidence: 'high' | 'medium' | 'low';
  alternatives?: string[];
};

const KEYWORDS: Array<{ patterns: RegExp[]; resolve: () => FieldMatch }> = [
  {
    patterns: [/legal.*(name|entity)/i, /organization.*name/i, /applicant.*name/i, /grantee.*name/i],
    resolve: () => ({ value: ORG_PROFILE.fullName, confidence: 'high', alternatives: [ORG_PROFILE.legalName, ORG_PROFILE.dba] }),
  },
  {
    patterns: [/dba|doing business/i],
    resolve: () => ({ value: ORG_PROFILE.dba, confidence: 'high' }),
  },
  {
    patterns: [/address/i, /street/i, /mailing/i],
    resolve: () => ({ value: ORG_PROFILE.address, confidence: 'high' }),
  },
  {
    patterns: [/city/i],
    resolve: () => ({ value: ORG_PROFILE.city, confidence: 'high' }),
  },
  {
    patterns: [/state/i],
    resolve: () => ({ value: ORG_PROFILE.state, confidence: 'high' }),
  },
  {
    patterns: [/zip|postal/i],
    resolve: () => ({ value: ORG_PROFILE.zip, confidence: 'high' }),
  },
  {
    patterns: [/phone|telephone/i],
    resolve: () => ({ value: ORG_PROFILE.phone, confidence: 'high' }),
  },
  {
    patterns: [/email/i],
    resolve: () => ({ value: ORG_PROFILE.email, confidence: 'high' }),
  },
  {
    patterns: [/website|url|web address/i],
    resolve: () => ({ value: ORG_PROFILE.website, confidence: 'high' }),
  },
  {
    patterns: [/primary contact|contact person|authorized rep/i],
    resolve: () => ({ value: ORG_PROFILE.primaryContactFull, confidence: 'high', alternatives: [ORG_PROFILE.primaryContact] }),
  },
  {
    patterns: [/title|position|role/i],
    resolve: () => ({ value: ORG_PROFILE.primaryTitle, confidence: 'medium' }),
  },
  {
    patterns: [/ein|tax id|employer identification/i],
    resolve: () => ({ value: ORG_PROFILE.ein, confidence: 'high' }),
  },
  {
    patterns: [/uei|unique entity/i],
    resolve: () => ({ value: ORG_PROFILE.uei, confidence: 'high' }),
  },
  {
    patterns: [/cage/i],
    resolve: () => ({ value: ORG_PROFILE.cageCode, confidence: 'high' }),
  },
  {
    patterns: [/sam\.gov|sam registration|registered bidder/i],
    resolve: () => ({ value: ORG_PROFILE.federal, confidence: 'high' }),
  },
  {
    patterns: [/org.*type|type.*org|entity type|nonprofit|public entity/i],
    resolve: () => ({ value: ORG_PROFILE.orgType, confidence: 'high', alternatives: ['Nonprofit', 'LLC'] }),
  },
  {
    patterns: [/mission/i],
    resolve: () => ({ value: ORG_PROFILE.mission, confidence: 'high' }),
  },
  {
    patterns: [/capability|capacity|experience|qualif/i],
    resolve: () => ({ value: ORG_PROFILE.capabilityStatement, confidence: 'high' }),
  },
  {
    patterns: [/statement of need|need statement|problem statement/i],
    resolve: () => ({ value: ORG_PROFILE.statementOfNeed, confidence: 'high' }),
  },
  {
    patterns: [/target population|who.*serve|participant.*eligib/i],
    resolve: () => ({ value: ORG_PROFILE.targetPopulation, confidence: 'high' }),
  },
  {
    patterns: [/service area|geographic|counties|region/i],
    resolve: () => ({ value: ORG_PROFILE.serviceArea, confidence: 'high' }),
  },
  {
    patterns: [/employer partner|partner employer/i],
    resolve: () => ({
      value: ORG_PROFILE.employerPartners.map(p => `${p.name} — ${p.type}, ${p.location}. ${p.role}.`).join('\n'),
      confidence: 'high',
    }),
  },
  {
    patterns: [/dol.*sponsor|apprenticeship.*sponsor|rapids/i],
    resolve: () => ({ value: ORG_PROFILE.dolSponsor, confidence: 'high' }),
  },
  {
    patterns: [/outcome|result|impact/i],
    resolve: () => ({ value: ORG_PROFILE.outcomesStatement, confidence: 'medium' }),
  },
  {
    patterns: [/compliance|reporting|data.*entry/i],
    resolve: () => ({ value: ORG_PROFILE.complianceStatement, confidence: 'medium' }),
  },
];

export function matchField(label: string): FieldMatch | null {
  for (const entry of KEYWORDS) {
    if (entry.patterns.some(p => p.test(label))) {
      return entry.resolve();
    }
  }
  return null;
}
