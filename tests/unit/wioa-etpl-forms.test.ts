import { describe, it, expect } from 'vitest';
import {
  validateIeapForm,
  validateSection188Checklist,
  IEAP_INITIAL,
  SECTION_188_INITIAL,
} from '@/lib/compliance/wioa-etpl-forms';

describe('validateIeapForm', () => {
  const base = {
    ...IEAP_INITIAL,
    program_title_etpl: 'HVAC Technician',
    is_new_program: true,
    program_description: 'Desc',
    recognized_credential_description: 'EPA 608',
    aligns_in_demand_industry: true,
    in_demand_narrative: 'Skilled trades demand',
  };

  it('accepts valid draft', () => {
    expect(validateIeapForm(base, { requireCompletion: false }).valid).toBe(true);
  });

  it('rejects non-new program flag', () => {
    const r = validateIeapForm({ ...base, is_new_program: false }, { requireCompletion: false });
    expect(r.valid).toBe(false);
  });

  it('requires attestation when completing', () => {
    const r = validateIeapForm(
      {
        ...base,
        prepared_by_name: 'Elizabeth Greene',
        prepared_date: '2026-05-30',
        attestation_signed: false,
      },
      { requireCompletion: true },
    );
    expect(r.valid).toBe(false);
  });
});

describe('validateSection188Checklist', () => {
  const complete = {
    ...SECTION_188_INITIAL,
    eo_officer_name: 'EO Officer',
    review_date: '2026-05-30',
    eo_officer_designated: true,
    notice_and_communication: true,
    assurance_language: true,
    affirmative_outreach: true,
    ada_physical_access: true,
    ada_programmatic_access: true,
    reasonable_accommodation_procedure: true,
    data_collection_equity: true,
    monitoring_recipients: true,
    complaint_processing_posted: true,
    complaint_processing_29cfr38: true,
    corrective_actions_documented: true,
    part_38_acknowledgment: true,
    facility_ada_compliant: true,
    nondiscriminatory_delivery_attestation: true,
    attestation_signed: true,
  };

  it('requires all checklist items when completing', () => {
    expect(validateSection188Checklist(complete, { requireCompletion: true }).valid).toBe(true);
    expect(
      validateSection188Checklist(
        { ...complete, facility_ada_compliant: false },
        { requireCompletion: true },
      ).valid,
    ).toBe(false);
  });
});
