/**
 * Grants.gov API Integration
 * Federal grant opportunities search and retrieval
 *
 * API Documentation: https://www.grants.gov/api/api-guide
 *
 * Search and opportunity retrieval use the public Grants.gov REST APIs.
 */

export interface GrantsGovOpportunity {
  id: string;
  number: string;
  title: string;
  agency: {
    code: string;
    name: string;
  };
  cfdaList?: {
    cfdaNumber: string;
    cfdaTitle: string;
  }[];
  synopsis?: {
    synopsisDesc: string;
    applicantTypes: string[];
    fundingActivityCategories: string[];
    fundingInstruments: string[];
  };
  dates: {
    postDate: string;
    closeDate: string;
    archiveDate?: string;
  };
  award?: {
    ceiling?: number;
    floor?: number;
    estimatedTotalProgramFunding?: number;
    expectedNumberOfAwards?: number;
  };
  eligibility?: {
    applicantTypes: string[];
    additionalInfo?: string;
  };
  status: string;
  opportunityCategory: string;
  opportunityUrl: string;
}

export interface GrantsGovSearchParams {
  keyword?: string;
  oppNum?: string;
  cfda?: string;
  agency?: string;
  eligibilities?: string[];
  fundingCategories?: string[];
  fundingInstruments?: string[];
  oppStatuses?: ('forecasted' | 'posted' | 'closed' | 'archived')[];
  sortBy?: 'openDate' | 'closeDate' | 'oppTitle' | 'agency';
  rows?: number;
  startRecordNum?: number;
}

export interface GrantsGovSearchResponse {
  totalCount: number;
  opportunities: GrantsGovOpportunity[];
  searchParams: GrantsGovSearchParams;
}

const GRANTS_GOV_BASE_URL = 'https://api.grants.gov/v1/api';

function descriptions(values: any): string[] {
  return Array.isArray(values)
    ? values.map((v) => (typeof v === 'string' ? v : v.description || v.id)).filter(Boolean)
    : [];
}
function amount(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const result = Number(String(value).replace(/[$,]/g, ''));
  return Number.isFinite(result) ? result : undefined;
}
function normalizeOpportunity(opp: any): GrantsGovOpportunity {
  const synopsis = opp.synopsis || opp.forecast;
  const id = String(opp.id || opp.oppId || '');
  if (!/^\d+$/.test(id)) throw new Error('Grants.gov returned an invalid opportunity identity');
  return {
    id,
    number: opp.number || opp.opportunityNumber || '',
    title: opp.title || opp.opportunityTitle || '',
    agency: {
      code: opp.agencyCode || opp.owningAgencyCode || synopsis?.agencyCode || '',
      name: opp.agencyName || synopsis?.agencyName || opp.agencyDetails?.agencyName || '',
    },
    cfdaList: (opp.alnist || opp.alns || []).map((v: any) => ({
      cfdaNumber: typeof v === 'string' ? v : v.alnNumber,
      cfdaTitle: v.programTitle || '',
    })),
    synopsis: synopsis
      ? {
          synopsisDesc: synopsis.synopsisDesc || synopsis.forecastDesc || '',
          applicantTypes: descriptions(synopsis.applicantTypes),
          fundingActivityCategories: descriptions(synopsis.fundingActivityCategories),
          fundingInstruments: descriptions(synopsis.fundingInstruments),
        }
      : undefined,
    dates: {
      postDate: opp.openDate || synopsis?.postingDate || '',
      closeDate: opp.closeDate || synopsis?.responseDate || synopsis?.responseDateDesc || '',
      archiveDate: opp.archiveDate || undefined,
    },
    award: synopsis
      ? {
          ceiling: amount(synopsis.awardCeiling),
          floor: amount(synopsis.awardFloor),
          estimatedTotalProgramFunding: amount(synopsis.estimatedFunding),
          expectedNumberOfAwards: amount(synopsis.numberOfAwards),
        }
      : undefined,
    eligibility: synopsis
      ? {
          applicantTypes: descriptions(synopsis.applicantTypes),
          additionalInfo: synopsis.applicantEligibilityDesc,
        }
      : undefined,
    status: opp.oppStatus || opp.status || (opp.forecast ? 'forecasted' : 'posted'),
    opportunityCategory:
      typeof opp.opportunityCategory === 'object'
        ? opp.opportunityCategory.description || ''
        : opp.opportunityCategory || '',
    opportunityUrl: `https://www.grants.gov/search-results-detail/${id}`,
  };
}
async function requestGrants(endpoint: string, body: Record<string, unknown>) {
  const response = await fetch(`${GRANTS_GOV_BASE_URL}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Grants.gov is unavailable (${response.status})`);
  const result = await response.json();
  if (result.errorcode !== 0 || !result.data)
    throw new Error('Grants.gov could not complete this request');
  return result.data;
}

/** Public Grants.gov Search2 API; no account credentials or API key are sent. */
export async function searchOpportunities(
  params: GrantsGovSearchParams,
): Promise<GrantsGovSearchResponse> {
  const data = await requestGrants('search2', {
    keyword: params.keyword || '',
    rows: Math.min(100, Math.max(1, params.rows || 25)),
    startRecordNum: Math.max(0, params.startRecordNum || 0),
    oppNum: params.oppNum || '',
    aln: params.cfda || '',
    agencies: params.agency || '',
    eligibilities: (params.eligibilities || []).join('|'),
    fundingCategories: (params.fundingCategories || []).join('|'),
    fundingInstruments: (params.fundingInstruments || []).join('|'),
    oppStatuses: (params.oppStatuses || ['forecasted', 'posted']).join('|'),
    sortBy: `${params.sortBy || 'closeDate'}|asc`,
  });
  if (!Array.isArray(data.oppHits))
    throw new Error('Grants.gov returned an invalid search response');
  return {
    totalCount: Number(data.hitCount ?? data.oppHits.length),
    opportunities: data.oppHits.map(normalizeOpportunity),
    searchParams: params,
  };
}

export async function getOpportunityDetails(oppId: string): Promise<GrantsGovOpportunity | null> {
  if (!/^\d+$/.test(oppId)) throw new Error('Invalid Grants.gov opportunity ID');
  return normalizeOpportunity(
    await requestGrants('fetchOpportunity', { opportunityId: Number(oppId) }),
  );
}

/**
 * Search for workforce development grants
 */
export async function searchWorkforceGrants(): Promise<GrantsGovSearchResponse> {
  return searchOpportunities({
    keyword: 'workforce development training',
    fundingCategories: ['ED', 'ELT'], // Education, Employment/Labor/Training
    oppStatuses: ['posted', 'forecasted'],
    rows: 50,
    sortBy: 'closeDate',
  });
}

/**
 * Search for education and training grants
 */
export async function searchEducationGrants(): Promise<GrantsGovSearchResponse> {
  return searchOpportunities({
    keyword: 'education training apprenticeship',
    fundingCategories: ['ED'], // Education
    oppStatuses: ['posted', 'forecasted'],
    rows: 50,
    sortBy: 'closeDate',
  });
}

/**
 * Search for DOL (Department of Labor) grants
 */
export async function searchDOLGrants(): Promise<GrantsGovSearchResponse> {
  return searchOpportunities({
    agency: 'DOL',
    oppStatuses: ['posted', 'forecasted'],
    rows: 50,
    sortBy: 'closeDate',
  });
}

/**
 * Search for HHS (Health and Human Services) grants
 */
export async function searchHHSGrants(): Promise<GrantsGovSearchResponse> {
  return searchOpportunities({
    agency: 'HHS',
    keyword: 'workforce healthcare training',
    oppStatuses: ['posted', 'forecasted'],
    rows: 50,
    sortBy: 'closeDate',
  });
}

/**
 * Search grants by CFDA number
 */
export async function searchByCFDA(cfdaNumber: string): Promise<GrantsGovSearchResponse> {
  return searchOpportunities({
    cfda: cfdaNumber,
    oppStatuses: ['posted', 'forecasted'],
    rows: 25,
  });
}

/**
 * Get grants relevant to Elevate for Humanity's mission
 */
export async function getRelevantGrants(): Promise<GrantsGovOpportunity[]> {
  const searches = await Promise.all([
    searchWorkforceGrants(),
    searchEducationGrants(),
    searchDOLGrants(),
  ]);

  // Combine and deduplicate
  const allOpportunities = searches.flatMap((s) => s.opportunities);
  const uniqueOpportunities = Array.from(new Map(allOpportunities.map((o) => [o.id, o])).values());

  // Sort by close date
  return uniqueOpportunities.sort((a, b) => {
    const dateA = new Date(a.dates.closeDate || '9999-12-31');
    const dateB = new Date(b.dates.closeDate || '9999-12-31');
    return dateA.getTime() - dateB.getTime();
  });
}

/**
 * Eligibility codes for nonprofit organizations
 */
export const NONPROFIT_ELIGIBILITY_CODES = [
  '12', // Nonprofits having a 501(c)(3) status
  '13', // Nonprofits that do not have a 501(c)(3) status
  '21', // Public and State controlled institutions of higher education
  '22', // Private institutions of higher education
];

/**
 * Funding category codes relevant to workforce development
 */
export const WORKFORCE_FUNDING_CATEGORIES = [
  'ED', // Education
  'ELT', // Employment, Labor and Training
  'HL', // Health
  'IS', // Income Security and Social Services
  'CD', // Community Development
];
