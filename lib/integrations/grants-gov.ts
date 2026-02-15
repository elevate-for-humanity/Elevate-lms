import { logger } from '@/lib/logger';
/**
 * Grants.gov API Integration
 * Federal grant opportunities search and retrieval
 * 
 * API Documentation: https://www.grants.gov/web/grants/s2s/applicant/web-services.html
 * 
 * Required env var: GRANTS_GOV_API_KEY (optional for search, required for apply)
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

const GRANTS_GOV_BASE_URL = 'https://www.grants.gov/grantsws/rest';

/**
 * Search for grant opportunities on Grants.gov
 */
export async function searchOpportunities(
  params: GrantsGovSearchParams
): Promise<GrantsGovSearchResponse> {
  const apiKey = process.env.GRANTS_GOV_API_KEY;
  
  const searchBody: Record<string, any> = {
    keyword: params.keyword || '',
    rows: params.rows || 25,
    startRecordNum: params.startRecordNum || 0,
  };

  if (params.oppNum) searchBody.oppNum = params.oppNum;
  if (params.cfda) searchBody.cfda = params.cfda;
  if (params.agency) searchBody.agency = params.agency;
  if (params.eligibilities?.length) searchBody.eligibilities = params.eligibilities;
  if (params.fundingCategories?.length) searchBody.fundingCategories = params.fundingCategories;
  if (params.fundingInstruments?.length) searchBody.fundingInstruments = params.fundingInstruments;
  if (params.oppStatuses?.length) searchBody.oppStatuses = params.oppStatuses;
  if (params.sortBy) searchBody.sortBy = params.sortBy;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${GRANTS_GOV_BASE_URL}/opportunities/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify(searchBody),
    });

    if (!response.ok) {
      logger.error('Grants.gov API error:', response.status, await response.text());
      return {
        totalCount: 0,
        opportunities: [],
        searchParams: params,
      };
    }

    const data = await response.json();
    
    const opportunities: GrantsGovOpportunity[] = (data.oppHits || []).map((opp: any) => ({
      id: opp.id || opp.oppId,
      number: opp.number || opp.oppNumber,
      title: opp.title || opp.oppTitle,
      agency: {
        code: opp.agencyCode || opp.agency?.code || '',
        name: opp.agencyName || opp.agency?.name || '',
      },
      cfdaList: opp.cfdaList || [],
      synopsis: opp.synopsis ? {
        synopsisDesc: opp.synopsis.synopsisDesc || '',
        applicantTypes: opp.synopsis.applicantTypes || [],
        fundingActivityCategories: opp.synopsis.fundingActivityCategories || [],
        fundingInstruments: opp.synopsis.fundingInstruments || [],
      } : undefined,
      dates: {
        postDate: opp.openDate || opp.postDate || '',
        closeDate: opp.closeDate || '',
        archiveDate: opp.archiveDate || undefined,
      },
      award: opp.award ? {
        ceiling: opp.award.ceiling,
        floor: opp.award.floor,
        estimatedTotalProgramFunding: opp.award.estimatedTotalProgramFunding,
        expectedNumberOfAwards: opp.award.expectedNumberOfAwards,
      } : undefined,
      eligibility: opp.eligibility ? {
        applicantTypes: opp.eligibility.applicantTypes || [],
        additionalInfo: opp.eligibility.additionalInfo,
      } : undefined,
      status: opp.oppStatus || opp.status || 'posted',
      opportunityCategory: opp.opportunityCategory || '',
      opportunityUrl: `https://www.grants.gov/search-results-detail/${opp.id || opp.oppId}`,
    }));

    return {
      totalCount: data.totalCount || data.hitCount || opportunities.length,
      opportunities,
      searchParams: params,
    };
  } catch (error) {
    logger.error('Error searching Grants.gov:', error);
    return {
      totalCount: 0,
      opportunities: [],
      searchParams: params,
    };
  }
}

/**
 * Get detailed information about a specific opportunity
 */
export async function getOpportunityDetails(
  oppId: string
): Promise<GrantsGovOpportunity | null> {
  const apiKey = process.env.GRANTS_GOV_API_KEY;

  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(
      `${GRANTS_GOV_BASE_URL}/opportunity/details/${oppId}`,
      { headers }
    );

    if (!response.ok) {
      logger.error('Grants.gov API error:', response.status);
      return null;
    }

    const opp = await response.json();

    return {
      id: opp.id || opp.oppId,
      number: opp.number || opp.oppNumber,
      title: opp.title || opp.oppTitle,
      agency: {
        code: opp.agencyCode || '',
        name: opp.agencyName || '',
      },
      cfdaList: opp.cfdaList || [],
      synopsis: opp.synopsis ? {
        synopsisDesc: opp.synopsis.synopsisDesc || '',
        applicantTypes: opp.synopsis.applicantTypes || [],
        fundingActivityCategories: opp.synopsis.fundingActivityCategories || [],
        fundingInstruments: opp.synopsis.fundingInstruments || [],
      } : undefined,
      dates: {
        postDate: opp.openDate || opp.postDate || '',
        closeDate: opp.closeDate || '',
        archiveDate: opp.archiveDate || undefined,
      },
      award: opp.award ? {
        ceiling: opp.award.ceiling,
        floor: opp.award.floor,
        estimatedTotalProgramFunding: opp.award.estimatedTotalProgramFunding,
        expectedNumberOfAwards: opp.award.expectedNumberOfAwards,
      } : undefined,
      eligibility: opp.eligibility ? {
        applicantTypes: opp.eligibility.applicantTypes || [],
        additionalInfo: opp.eligibility.additionalInfo,
      } : undefined,
      status: opp.oppStatus || opp.status || 'posted',
      opportunityCategory: opp.opportunityCategory || '',
      opportunityUrl: `https://www.grants.gov/search-results-detail/${opp.id || opp.oppId}`,
    };
  } catch (error) {
    logger.error('Error fetching Grants.gov opportunity:', error);
    return null;
  }
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
  const allOpportunities = searches.flatMap(s => s.opportunities);
  const uniqueOpportunities = Array.from(
    new Map(allOpportunities.map(o => [o.id, o])).values()
  );

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
  'ED',  // Education
  'ELT', // Employment, Labor and Training
  'HL',  // Health
  'IS',  // Income Security and Social Services
  'CD',  // Community Development
];
