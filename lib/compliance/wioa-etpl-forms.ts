/**
 * Indiana INTraining / ETPL WIOA compliance form schemas.
 * Aligns with DWD Policy 2020-16, TA 2020-17, WIOA §122/§188, 20 CFR 680.450, 29 CFR Part 38.
 */

export type WioaComplianceFormType =
  | 'initial_eligibility_aggregate_performance'
  | 'section_188_checklist';

export type FormStatus = 'draft' | 'completed';

export interface IeapFormData {
  intraining_program_id: string;
  program_title_etpl: string;
  cip_code: string;
  soc_code: string;
  training_hours: string;
  duration_weeks: string;
  is_new_program: boolean;
  no_completer_data_attestation: boolean;
  initial_eligibility_fiscal_year: string;
  program_description: string;
  recognized_credential_description: string;
  credential_issuing_authority: string;
  aligns_in_demand_industry: boolean;
  in_demand_narrative: string;
  has_business_partnerships: boolean;
  partnership_description: string;
  employer_partners: string;
  delivery_online_statewide: boolean;
  published_catalog_pricing: boolean;
  general_public_availability: boolean;
  employment_rate_q2_pct: string;
  employment_rate_q4_pct: string;
  median_earnings_q2: string;
  credential_attainment_rate_pct: string;
  completion_rate_pct: string;
  performance_data_not_applicable: boolean;
  prepared_by_name: string;
  prepared_by_title: string;
  prepared_date: string;
  attestation_signed: boolean;
}

export interface Section188ChecklistData {
  eo_officer_name: string;
  eo_officer_email: string;
  program_location_address: string;
  review_date: string;
  next_annual_review_due: string;
  eo_officer_designated: boolean;
  notice_and_communication: boolean;
  assurance_language: boolean;
  affirmative_outreach: boolean;
  ada_physical_access: boolean;
  ada_programmatic_access: boolean;
  reasonable_accommodation_procedure: boolean;
  data_collection_equity: boolean;
  monitoring_recipients: boolean;
  complaint_processing_posted: boolean;
  complaint_processing_29cfr38: boolean;
  corrective_actions_documented: boolean;
  part_38_acknowledgment: boolean;
  facility_ada_compliant: boolean;
  nondiscriminatory_delivery_attestation: boolean;
  notes: string;
  attestation_signed: boolean;
}

export const IEAP_INITIAL: IeapFormData = {
  intraining_program_id: '',
  program_title_etpl: '',
  cip_code: '',
  soc_code: '',
  training_hours: '',
  duration_weeks: '',
  is_new_program: true,
  no_completer_data_attestation: true,
  initial_eligibility_fiscal_year: '',
  program_description: '',
  recognized_credential_description: '',
  credential_issuing_authority: '',
  aligns_in_demand_industry: false,
  in_demand_narrative: '',
  has_business_partnerships: false,
  partnership_description: '',
  employer_partners: '',
  delivery_online_statewide: false,
  published_catalog_pricing: false,
  general_public_availability: false,
  employment_rate_q2_pct: '',
  employment_rate_q4_pct: '',
  median_earnings_q2: '',
  credential_attainment_rate_pct: '',
  completion_rate_pct: '',
  performance_data_not_applicable: true,
  prepared_by_name: '',
  prepared_by_title: '',
  prepared_date: '',
  attestation_signed: false,
};

export const SECTION_188_INITIAL: Section188ChecklistData = {
  eo_officer_name: '',
  eo_officer_email: '',
  program_location_address: '',
  review_date: '',
  next_annual_review_due: '',
  eo_officer_designated: false,
  notice_and_communication: false,
  assurance_language: false,
  affirmative_outreach: false,
  ada_physical_access: false,
  ada_programmatic_access: false,
  reasonable_accommodation_procedure: false,
  data_collection_equity: false,
  monitoring_recipients: false,
  complaint_processing_posted: false,
  complaint_processing_29cfr38: false,
  corrective_actions_documented: false,
  part_38_acknowledgment: false,
  facility_ada_compliant: false,
  nondiscriminatory_delivery_attestation: false,
  notes: '',
  attestation_signed: false,
};

const SECTION_188_REQUIRED_BOOLS: (keyof Section188ChecklistData)[] = [
  'eo_officer_designated',
  'notice_and_communication',
  'assurance_language',
  'affirmative_outreach',
  'ada_physical_access',
  'ada_programmatic_access',
  'reasonable_accommodation_procedure',
  'data_collection_equity',
  'monitoring_recipients',
  'complaint_processing_posted',
  'complaint_processing_29cfr38',
  'corrective_actions_documented',
  'part_38_acknowledgment',
  'facility_ada_compliant',
  'nondiscriminatory_delivery_attestation',
];

export function validateIeapForm(
  data: IeapFormData,
  options: { requireCompletion?: boolean },
): { valid: boolean; error?: string } {
  const complete = options.requireCompletion ?? false;
  if (!data.program_title_etpl.trim()) {
    return { valid: false, error: 'Program title (must match INTraining/ETPL listing) is required' };
  }
  if (!data.is_new_program) {
    return { valid: false, error: 'IEAP applies to new programs only — confirm this is a new program' };
  }
  if (!data.program_description.trim()) {
    return { valid: false, error: 'Program description is required' };
  }
  if (!data.recognized_credential_description.trim()) {
    return { valid: false, error: 'Recognized post-secondary credential description is required' };
  }
  if (!data.aligns_in_demand_industry) {
    return { valid: false, error: 'Confirm alignment with an in-demand industry or occupation' };
  }
  if (!data.in_demand_narrative.trim()) {
    return { valid: false, error: 'Describe how the program aligns with in-demand occupations' };
  }
  if (complete) {
    if (!data.no_completer_data_attestation && !data.performance_data_not_applicable) {
      const hasMetric =
        data.employment_rate_q2_pct.trim() ||
        data.employment_rate_q4_pct.trim() ||
        data.median_earnings_q2.trim() ||
        data.credential_attainment_rate_pct.trim() ||
        data.completion_rate_pct.trim();
      if (!hasMetric) {
        return {
          valid: false,
          error:
            'Provide aggregate performance metrics or attest that completer data is not yet available (new program)',
        };
      }
    }
    if (!data.prepared_by_name.trim() || !data.prepared_date.trim()) {
      return { valid: false, error: 'Preparer name and date are required to mark complete' };
    }
    if (!data.attestation_signed) {
      return { valid: false, error: 'Sign the attestation to mark this IEAP complete' };
    }
  }
  return { valid: true };
}

export function validateSection188Checklist(
  data: Section188ChecklistData,
  options: { requireCompletion?: boolean },
): { valid: boolean; error?: string } {
  const complete = options.requireCompletion ?? false;
  if (!data.eo_officer_name.trim()) {
    return { valid: false, error: 'Equal Opportunity Officer name is required' };
  }
  if (!data.review_date.trim()) {
    return { valid: false, error: 'Review date is required' };
  }
  if (complete) {
    for (const key of SECTION_188_REQUIRED_BOOLS) {
      if (!data[key]) {
        return {
          valid: false,
          error: `All Section 188 checklist items must be confirmed before marking complete`,
        };
      }
    }
    if (!data.attestation_signed) {
      return { valid: false, error: 'Sign the attestation to mark the checklist complete' };
    }
  }
  return { valid: true };
}

export function mergeIeapFromProgram(program: {
  title?: string | null;
  cip_code?: string | null;
  soc_code?: string | null;
  estimated_hours?: number | null;
  estimated_weeks?: number | null;
  intraining_program_id?: string | null;
  description?: string | null;
  credential_name?: string | null;
}): IeapFormData {
  return {
    ...IEAP_INITIAL,
    intraining_program_id: program.intraining_program_id ?? '',
    program_title_etpl: program.title ?? '',
    cip_code: program.cip_code ?? '',
    soc_code: program.soc_code ?? '',
    training_hours: program.estimated_hours != null ? String(program.estimated_hours) : '',
    duration_weeks: program.estimated_weeks != null ? String(program.estimated_weeks) : '',
    program_description: program.description ?? '',
    recognized_credential_description: program.credential_name ?? '',
  };
}

export const FORM_LABELS: Record<WioaComplianceFormType, string> = {
  initial_eligibility_aggregate_performance:
    'Initial Eligibility Aggregate Performance (new programs)',
  section_188_checklist: 'Equal Opportunity — Section 188 Compliance Checklist',
};
