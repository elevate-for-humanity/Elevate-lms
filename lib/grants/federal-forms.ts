/**
 * Federal Forms Auto-Fill
 * Generates pre-filled federal grant forms (SF-424, SF-424A, SF-LLL, etc.)
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getEntityByUEI } from '@/lib/integrations/sam-gov';

export interface SF424Data {
  // 1. Type of Submission
  typeOfSubmission: 'preapplication' | 'application' | 'changed_corrected';

  // 2. Type of Application
  typeOfApplication: 'new' | 'continuation' | 'revision';

  // 3. Date Received
  dateReceived?: string;

  // 4. Applicant Identifier
  applicantIdentifier?: string;

  // 5. Federal Entity Identifier
  federalEntityIdentifier?: string;

  // 6. Date Received by State
  dateReceivedByState?: string;

  // 7. State Application Identifier
  stateApplicationIdentifier?: string;

  // 8. Applicant Information
  applicant: {
    legalName: string;
    employerTaxId: string;
    organizationalDUNS?: string;
    organizationalUEI: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    county?: string;
    state: string;
    zip: string;
    country: string;
    organizationType: string;
  };

  // 9. Type of Applicant
  applicantType: string;

  // 10. Name of Federal Agency
  federalAgency: string;

  // 11. Catalog of Federal Domestic Assistance (CFDA)
  cfdaNumber?: string;
  cfdaTitle?: string;

  // 12. Funding Opportunity Number
  fundingOpportunityNumber?: string;

  // 13. Competition Identification Number
  competitionId?: string;

  // 14. Areas Affected by Project
  areasAffected: string[];

  // 15. Descriptive Title of Applicant's Project
  projectTitle: string;

  // 16. Congressional Districts
  congressionalDistricts: {
    applicant: string;
    project: string[];
  };

  // 17. Proposed Project Dates
  projectDates: {
    start: string;
    end: string;
  };

  // 18. Estimated Funding
  funding: {
    federal: number;
    applicant: number;
    state: number;
    local: number;
    other: number;
    programIncome: number;
    total: number;
  };

  // 19. Is Application Subject to Review by State?
  stateReview: 'yes' | 'no' | 'not_applicable';

  // 20. Is Applicant Delinquent on Federal Debt?
  delinquentOnDebt: 'yes' | 'no';

  // 21. Authorized Representative
  authorizedRep: {
    prefix?: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    suffix?: string;
    title: string;
    telephone: string;
    fax?: string;
    email: string;
    signature?: string;
    dateSign: string;
  };
}

export interface SF424AData {
  // Budget Information for Non-Construction Programs
  sections: {
    // Section A - Budget Summary
    budgetSummary: {
      grantProgram: string;
      cfdaNumber: string;
      federal: number;
      nonFederal: number;
      total: number;
    }[];

    // Section B - Budget Categories
    budgetCategories: {
      personnel: number;
      fringeBenefits: number;
      travel: number;
      equipment: number;
      supplies: number;
      contractual: number;
      construction: number;
      other: number;
      totalDirectCharges: number;
      indirectCharges: number;
      total: number;
    };

    // Section C - Non-Federal Resources
    nonFederalResources: {
      applicant: number;
      state: number;
      otherSources: number;
      total: number;
    };

    // Section D - Forecasted Cash Needs
    cashNeeds: {
      federal: number[];
      nonFederal: number[];
      total: number[];
    };

    // Section E - Budget Estimates of Federal Funds Needed
    federalFundsNeeded: {
      firstYear: number;
      secondYear?: number;
      thirdYear?: number;
      fourthYear?: number;
      total: number;
    };

    // Section F - Other Budget Information
    otherBudgetInfo?: string;
  };
}

export interface SFLLLData {
  // Disclosure of Lobbying Activities

  // 1. Type of Federal Action
  federalActionType: 'contract' | 'grant' | 'cooperative_agreement' | 'loan' | 'loan_guarantee' | 'loan_insurance';

  // 2. Status of Federal Action
  federalActionStatus: 'bid_offer_application' | 'initial_award' | 'post_award';

  // 3. Report Type
  reportType: 'initial' | 'material_change';

  // 4. Name and Address of Reporting Entity
  reportingEntity: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    congressionalDistrict?: string;
  };

  // 5. Federal Department/Agency
  federalDepartment: string;

  // 6. Federal Program Name/Description
  federalProgram: string;

  // 7. Federal Action Number
  federalActionNumber?: string;

  // 8. Federal Award Amount
  federalAwardAmount?: number;

  // 9. Lobbying Registrant
  lobbyingRegistrant?: {
    name: string;
    address: string;
    individuals: string[];
  };

  // 10. Individuals Performing Services
  individuals?: string[];

  // 11. Amount of Payment
  paymentAmount?: number;

  // 12. Form of Payment
  paymentForm?: string;

  // 13. Type of Payment
  paymentType?: string;

  // 14. Brief Description of Services
  servicesDescription?: string;

  // 15. Continuation Sheet
  continuationSheet?: boolean;

  // 16. Information Requested Through This Form is Authorized
  authorized: boolean;

  // Signature
  signature: {
    name: string;
    title: string;
    telephone: string;
    date: string;
  };
}

/**
 * Generate SF-424 form data from entity and grant
 */
export async function generateSF424(
  entityId: string,
  grantId: string,
  projectTitle: string,
  projectDates: { start: string; end: string },
  funding: SF424Data['funding']
): Promise<SF424Data> {
  const { data: entity, error: entityError } = await supabaseAdmin
    .from('entities')
    .select('*')
    .eq('id', entityId)
    .single();

  if (entityError || !entity) {
    throw new Error('Entity not found');
  }

  const { data: grant, error: grantError } = await supabaseAdmin
    .from('grant_opportunities')
    .select('*')
    .eq('id', grantId)
    .single();

  if (grantError || !grant) {
    throw new Error('Grant not found');
  }

  let samData = null;
  if (entity.uei) {
    try {
      samData = await getEntityByUEI(entity.uei);
    } catch (error) { /* Error handled silently */ 
      // Error: $1
    }
  }

  const congressionalDistrict = entity.congressional_district || '00';

  return {
    typeOfSubmission: 'application',
    typeOfApplication: 'new',
    dateReceived: new Date().toISOString().split('T')[0],
    applicant: {
      legalName: entity.name,
      employerTaxId: entity.ein || '',
      organizationalUEI: entity.uei || '',
      addressLine1: entity.address || '',
      city: entity.city || '',
      state: entity.state || '',
      zip: entity.zip || '',
      country: 'USA',
      organizationType: entity.entity_type || 'nonprofit',
    },
    applicantType: entity.entity_type === 'nonprofit' ? 'M' : 'C',
    federalAgency: grant.agency || '',
    cfdaNumber: grant.cfda_number || undefined,
    cfdaTitle: grant.title,
    fundingOpportunityNumber: grant.external_id || undefined,
    areasAffected: [entity.state || 'IN'],
    projectTitle,
    congressionalDistricts: {
      applicant: congressionalDistrict,
      project: [congressionalDistrict],
    },
    projectDates,
    funding,
    stateReview: 'not_applicable',
    delinquentOnDebt: 'no',
    authorizedRep: {
      firstName: entity.contact_first_name || 'Elizabeth',
      lastName: entity.contact_last_name || 'Greene',
      title: entity.contact_title || 'Executive Director',
      telephone: entity.phone || '',
      email: entity.email || '',
      dateSign: new Date().toISOString().split('T')[0],
    },
  };
}

/**
 * Generate SF-424A Budget form
 */
export async function generateSF424A(
  entityId: string,
  grantId: string,
  budgetData: SF424AData['sections']['budgetCategories']
): Promise<SF424AData> {
  const { data: grant } = await supabaseAdmin
    .from('grant_opportunities')
    .select('*')
    .eq('id', grantId)
    .single();

  if (!grant) {
    throw new Error('Grant not found');
  }

  return {
    sections: {
      budgetSummary: [
        {
          grantProgram: grant.title,
          cfdaNumber: grant.cfda_number || '',
          federal: budgetData.total,
          nonFederal: 0,
          total: budgetData.total,
        },
      ],
      budgetCategories: budgetData,
      nonFederalResources: {
        applicant: 0,
        state: 0,
        otherSources: 0,
        total: 0,
      },
      cashNeeds: {
        federal: [budgetData.total / 4, budgetData.total / 4, budgetData.total / 4, budgetData.total / 4],
        nonFederal: [0, 0, 0, 0],
        total: [budgetData.total / 4, budgetData.total / 4, budgetData.total / 4, budgetData.total / 4],
      },
      federalFundsNeeded: {
        firstYear: budgetData.total,
        total: budgetData.total,
      },
    },
  };
}

/**
 * Generate SF-LLL Lobbying Disclosure form
 */
export async function generateSFLLL(
  entityId: string,
  grantId: string
): Promise<SFLLLData> {
  const { data: entity } = await supabaseAdmin
    .from('entities')
    .select('*')
    .eq('id', entityId)
    .single();

  const { data: grant } = await supabaseAdmin
    .from('grant_opportunities')
    .select('*')
    .eq('id', grantId)
    .single();

  if (!entity || !grant) {
    throw new Error('Entity or grant not found');
  }

  return {
    federalActionType: 'grant',
    federalActionStatus: 'bid_offer_application',
    reportType: 'initial',
    reportingEntity: {
      name: entity.name,
      address: entity.address || '',
      city: entity.city || '',
      state: entity.state || '',
      zip: entity.zip || '',
      congressionalDistrict: entity.congressional_district || undefined,
    },
    federalDepartment: grant.agency || '',
    federalProgram: grant.title,
    authorized: true,
    signature: {
      name: `${entity.contact_first_name || 'Elizabeth'} ${entity.contact_last_name || 'Greene'}`,
      title: entity.contact_title || 'Executive Director',
      telephone: entity.phone || '',
      date: new Date().toISOString().split('T')[0],
    },
  };
}

/**
 * Generate all federal forms for a grant application
 */
export async function generateAllFederalForms(
  applicationId: string
): Promise<{
  sf424: SF424Data;
  sf424a: SF424AData;
  sflll: SFLLLData;
}> {
  const { data: app, error } = await supabaseAdmin
    .from('grant_applications')
    .select('*, grant:grant_opportunities(*), entity:entities(*)')
    .eq('id', applicationId)
    .single();

  if (error || !app) {
    throw new Error('Application not found');
  }

  const projectDates = {
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
  };

  const funding = {
    federal: 500000,
    applicant: 0,
    state: 0,
    local: 0,
    other: 0,
    programIncome: 0,
    total: 500000,
  };

  const budgetCategories = {
    personnel: 300000,
    fringeBenefits: 75000,
    travel: 10000,
    equipment: 25000,
    supplies: 15000,
    contractual: 30000,
    construction: 0,
    other: 20000,
    totalDirectCharges: 475000,
    indirectCharges: 25000,
    total: 500000,
  };

  const sf424 = await generateSF424(
    app.entity_id,
    app.grant_id,
    app.draft_title || 'Workforce Development Project',
    projectDates,
    funding
  );

  const sf424a = await generateSF424A(
    app.entity_id,
    app.grant_id,
    budgetCategories
  );

  const sflll = await generateSFLLL(app.entity_id, app.grant_id);

  await supabaseAdmin.from('grant_federal_forms').upsert(
    {
      application_id: applicationId,
      sf424_data: sf424,
      sf424a_data: sf424a,
      sflll_data: sflll,
      generated_at: new Date().toISOString(),
    },
    { onConflict: 'application_id' }
  );

  return {
    sf424,
    sf424a,
    sflll,
  };
}
