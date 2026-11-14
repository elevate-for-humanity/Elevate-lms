/**
 * lib/contracts/response-style.ts
 *
 * Humanized narrative generation for state contracts, grant applications,
 * MOUs, and agency compliance forms.
 *
 * Rules:
 * - Never invent facts. Pull from org facts first.
 * - If data is missing, return null and mark as "Needs Admin Input."
 * - Narrative answers must sound like a real founder/operator wrote them.
 * - No hype. No generic filler. No robotic AI tone.
 * - Every AI-drafted field is flagged as source: 'ai_drafted'.
 * - Admin must approve before export.
 */

export type ResponseStyleMode =
  | 'state_contract_formal'
  | 'grant_persuasive'
  | 'agency_compliance'
  | 'workforce_development'
  | 'partner_mou'
  | 'budget_justification'
  | 'executive_summary';

export type FieldSource =
  | 'repository_verified'   // pulled directly from org facts / DB
  | 'uploaded_document'     // extracted from an uploaded file
  | 'manual_admin_input'    // admin typed it in
  | 'ai_drafted_narrative'  // AI generated, must be reviewed
  | 'needs_admin_input';    // missing — cannot be auto-filled

export interface NarrativeField {
  field_key: string;
  label: string;
  value: string | null;
  source: FieldSource;
  confidence: number;        // 0-1
  ai_drafted: boolean;
  needs_review: boolean;
  admin_note?: string;
}

export interface OrgContext {
  legal_name?: string;
  dba_name?: string;
  ein?: string;
  uei?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  executive_director?: string;
  authorized_signer?: string;
  authorized_signer_title?: string;
  mission_statement?: string;
  org_overview?: string;
  target_populations?: string;
  counties_served?: string[];
  years_in_operation?: number;
  staff_count?: number;
  programs?: string[];
  program_descriptions?: Record<string, string>;
  annual_participants?: number;
  placement_rate?: string;
  completion_rate?: string;
  wioa_eligible?: boolean;
  insurance_status?: string;
  audit_status?: string;
  sam_status?: string;
  // Additional approved facts
  facts?: Record<string, string>;
}

// ── Style instructions per mode ───────────────────────────────────────────────

const STYLE_INSTRUCTIONS: Record<ResponseStyleMode, string> = {
  state_contract_formal: `
Write in formal, professional language appropriate for a state government contract.
Use complete sentences. Be specific and factual. Avoid jargon.
Reference specific programs, populations, and outcomes where data is available.
Do not use phrases like "we are committed to" unless followed by a specific, verifiable action.
Do not use superlatives. Do not use marketing language.
Write as if a seasoned nonprofit executive director is responding to a state procurement officer.
`,
  grant_persuasive: `
Write in clear, persuasive language appropriate for a federal or state grant application.
Lead with the problem, then the solution, then the evidence.
Use specific numbers and outcomes where available. If numbers are not available, describe the approach concretely.
Avoid generic statements. Every sentence should advance the case for funding.
Write as if a founder who has run this program for years is explaining it to a program officer who has seen hundreds of applications.
Do not oversell. Funders distrust hype. Credibility comes from specificity.
`,
  agency_compliance: `
Write in precise, compliance-focused language.
Reference specific policies, procedures, and standards where applicable.
Be direct and unambiguous. Avoid hedging language.
Write as if a compliance officer is documenting an established process.
`,
  workforce_development: `
Write in accessible, outcome-focused language appropriate for workforce development funders.
Emphasize employment outcomes, wage gains, industry credentials, and employer partnerships.
Reference specific programs, certifications, and target populations.
Write as if a workforce program director is presenting to a workforce board or DOL reviewer.
`,
  partner_mou: `
Write in collaborative, professional language appropriate for a memorandum of understanding.
Be specific about roles, responsibilities, and mutual benefits.
Avoid vague commitments. Every obligation should be concrete and measurable.
Write as if two organizations are documenting a real working relationship, not a ceremonial agreement.
`,
  budget_justification: `
Write in clear, line-item-level language that justifies each cost category.
Connect every expense to a program activity or outcome.
Be specific about quantities, rates, and time periods.
Do not pad. Do not include costs that cannot be justified by program need.
Write as if a grants manager is explaining the budget to a skeptical program officer.
`,
  executive_summary: `
Write a concise, compelling executive summary.
Cover: who we are, what problem we solve, how we solve it, what results we produce, and what we are asking for.
Maximum clarity. No filler. Every sentence must earn its place.
Write as if the reader has 90 seconds and will decide based on this summary alone.
`,
};

// ── Humanization transforms ───────────────────────────────────────────────────

export type HumanizationControl =
  | 'make_more_formal'
  | 'make_more_concise'
  | 'make_more_persuasive'
  | 'make_more_compliance_focused'
  | 'remove_fluff'
  | 'add_measurable_outcomes'
  | 'use_founder_voice';

const HUMANIZATION_PROMPTS: Record<HumanizationControl, string> = {
  make_more_formal:
    'Rewrite this in more formal, professional language suitable for a government contract. Remove contractions. Use complete sentences.',
  make_more_concise:
    'Rewrite this to be more concise. Remove redundant phrases. Keep every sentence that adds meaning. Cut everything else.',
  make_more_persuasive:
    'Rewrite this to be more persuasive. Lead with the strongest point. Use specific evidence. Make the case clearly without overselling.',
  make_more_compliance_focused:
    'Rewrite this to emphasize compliance, process, and accountability. Reference specific procedures and standards.',
  remove_fluff:
    'Remove all filler phrases, vague commitments, and generic language. Keep only specific, factual, actionable content.',
  add_measurable_outcomes:
    'Add specific, measurable outcomes where the text is vague. Use numbers, percentages, or concrete milestones where possible.',
  use_founder_voice:
    'Rewrite this in the voice of a founder who has run this organization for years. Direct, confident, specific. Not corporate. Not robotic.',
};

// ── Exact-data field keys (never AI-generated) ────────────────────────────────

export const EXACT_DATA_FIELDS = new Set([
  'legal_name', 'dba_name', 'ein', 'uei', 'sam_status',
  'address', 'phone', 'email', 'website',
  'executive_director', 'authorized_signer', 'authorized_signer_title',
  'years_in_operation', 'staff_count', 'board_count',
  'insurance_status', 'audit_status',
  'annual_participants', 'placement_rate', 'completion_rate',
  'wioa_eligible', 'banking_info', 'license_numbers',
  'board_approvals', 'audited_financials',
]);

// Fields that must NEVER be AI-generated — always needs_admin_input if missing
export const NEVER_AI_GENERATE = new Set([
  'ein', 'uei', 'sam_status', 'banking_info', 'license_numbers',
  'board_approvals', 'audited_financials', 'insurance_limits',
  'official_certifications', 'legal_claims', 'exact_student_numbers',
]);

// ── Org context → exact field resolution ─────────────────────────────────────

export function resolveExactField(
  fieldKey: string,
  org: OrgContext,
): { value: string | null; source: FieldSource } {
  const map: Record<string, () => string | null | undefined> = {
    legal_name:               () => org.legal_name,
    dba_name:                 () => org.dba_name,
    ein:                      () => org.ein,
    uei:                      () => org.uei,
    sam_status:               () => org.sam_status,
    address:                  () => org.address,
    phone:                    () => org.phone,
    email:                    () => org.email,
    website:                  () => org.website,
    executive_director:       () => org.executive_director,
    authorized_signer:        () => org.authorized_signer,
    authorized_signer_title:  () => org.authorized_signer_title,
    years_in_operation:       () => org.years_in_operation?.toString(),
    staff_count:              () => org.staff_count?.toString(),
    counties_served:          () => org.counties_served?.join(', '),
    annual_participants:      () => org.annual_participants?.toString(),
    placement_rate:           () => org.placement_rate,
    completion_rate:          () => org.completion_rate,
    insurance_status:         () => org.insurance_status,
    audit_status:             () => org.audit_status,
  };

  // Check direct map
  const resolver = map[fieldKey];
  if (resolver) {
    const val = resolver();
    if (val && val.trim()) {
      return { value: val.trim(), source: 'repository_verified' };
    }
  }

  // Check org.facts (approved facts from sos_organization_facts)
  if (org.facts?.[fieldKey]) {
    return { value: org.facts[fieldKey], source: 'repository_verified' };
  }

  return { value: null, source: 'needs_admin_input' };
}

// ── Narrative field prompts ───────────────────────────────────────────────────

export const NARRATIVE_FIELD_PROMPTS: Record<string, (org: OrgContext) => string> = {
  organizational_background: (org) => `
Write a 2-3 paragraph organizational background for ${org.legal_name || 'our organization'}.
${org.dba_name ? `Also known as ${org.dba_name}.` : ''}
${org.years_in_operation ? `We have been operating for ${org.years_in_operation} years.` : ''}
${org.mission_statement ? `Our mission: ${org.mission_statement}` : ''}
${org.target_populations ? `We serve: ${org.target_populations}` : ''}
${org.counties_served?.length ? `Geographic focus: ${org.counties_served.join(', ')}` : ''}
${org.staff_count ? `We have ${org.staff_count} staff members.` : ''}
Do not invent facts. Use only what is provided above.
`,

  program_description: (org) => `
Write a clear program description for the following programs:
${org.programs?.join(', ') || '[Programs not specified — admin must provide]'}
${org.program_descriptions ? Object.entries(org.program_descriptions).map(([k, v]) => `${k}: ${v}`).join('\n') : ''}
Focus on what the program does, who it serves, and what outcomes it produces.
Be specific. Do not use generic workforce development language.
`,

  target_population: (org) => `
Describe the target population for this program.
${org.target_populations ? `Known populations: ${org.target_populations}` : ''}
${org.counties_served?.length ? `Service area: ${org.counties_served.join(', ')}` : ''}
Include demographics, barriers to employment, and why this population needs this service.
Use only facts provided. Do not invent statistics.
`,

  need_statement: (org) => `
Write a need statement explaining why this program is necessary.
${org.target_populations ? `Population served: ${org.target_populations}` : ''}
${org.counties_served?.length ? `Service area: ${org.counties_served.join(', ')}` : ''}
Reference local workforce conditions, barriers, and gaps in services.
Do not invent statistics. If specific data is not available, describe the conditions qualitatively.
`,

  scope_of_work: (org) => `
Write a scope of work for this contract/grant.
${org.programs?.length ? `Programs: ${org.programs.join(', ')}` : ''}
${org.annual_participants ? `Annual participants served: ${org.annual_participants}` : ''}
Be specific about activities, deliverables, timelines, and responsible parties.
`,

  staffing_plan: (org) => `
Write a staffing plan.
${org.staff_count ? `Total staff: ${org.staff_count}` : ''}
Describe key roles, qualifications, and responsibilities.
Do not invent specific names or credentials not provided.
`,

  compliance_approach: (org) => `
Describe the compliance approach for this program.
${org.audit_status ? `Audit status: ${org.audit_status}` : ''}
${org.insurance_status ? `Insurance status: ${org.insurance_status}` : ''}
Cover data privacy, reporting, record-keeping, and regulatory compliance.
Be specific about processes, not just intentions.
`,

  sustainability_plan: (org) => `
Write a sustainability plan explaining how this program will continue after the grant period.
${org.programs?.length ? `Programs: ${org.programs.join(', ')}` : ''}
Cover revenue diversification, employer partnerships, and community integration.
Be realistic. Do not promise outcomes that are not supported by the organization's track record.
`,

  budget_justification: (org) => `
Write a budget justification narrative.
${org.staff_count ? `Staff count: ${org.staff_count}` : ''}
${org.annual_participants ? `Participants served: ${org.annual_participants}` : ''}
Justify each major cost category by connecting it to program activities and outcomes.
Be specific about quantities, rates, and time periods.
`,

  outcomes: (org) => `
Describe the expected outcomes of this program.
${org.placement_rate ? `Historical placement rate: ${org.placement_rate}` : ''}
${org.completion_rate ? `Historical completion rate: ${org.completion_rate}` : ''}
${org.annual_participants ? `Annual participants: ${org.annual_participants}` : ''}
Use specific, measurable outcomes. If historical data is available, reference it.
Do not invent statistics.
`,

  equity_access: (org) => `
Write an equity and access statement.
${org.target_populations ? `Populations served: ${org.target_populations}` : ''}
${org.counties_served?.length ? `Service area: ${org.counties_served.join(', ')}` : ''}
Describe how the program removes barriers and ensures equitable access.
Be specific about accommodations, outreach, and support services.
`,

  past_performance: (org) => `
Describe past performance and organizational track record.
${org.years_in_operation ? `Years in operation: ${org.years_in_operation}` : ''}
${org.placement_rate ? `Placement rate: ${org.placement_rate}` : ''}
${org.completion_rate ? `Completion rate: ${org.completion_rate}` : ''}
${org.annual_participants ? `Annual participants: ${org.annual_participants}` : ''}
Reference specific programs, outcomes, and partnerships.
Do not invent awards, contracts, or outcomes not provided.
`,
};

// ── Build system prompt for AI narrative generation ───────────────────────────

export function buildNarrativeSystemPrompt(
  mode: ResponseStyleMode,
  org: OrgContext,
): string {
  const style = STYLE_INSTRUCTIONS[mode];
  const orgSummary = [
    org.legal_name && `Organization: ${org.legal_name}`,
    org.dba_name && `DBA: ${org.dba_name}`,
    org.mission_statement && `Mission: ${org.mission_statement}`,
    org.target_populations && `Populations served: ${org.target_populations}`,
    org.counties_served?.length && `Counties: ${org.counties_served.join(', ')}`,
    org.years_in_operation && `Years operating: ${org.years_in_operation}`,
    org.staff_count && `Staff: ${org.staff_count}`,
    org.programs?.length && `Programs: ${org.programs.join(', ')}`,
    org.annual_participants && `Annual participants: ${org.annual_participants}`,
    org.placement_rate && `Placement rate: ${org.placement_rate}`,
    org.completion_rate && `Completion rate: ${org.completion_rate}`,
  ].filter(Boolean).join('\n');

  return `You are a professional grant writer and contract specialist for a workforce development nonprofit.

ORGANIZATION CONTEXT:
${orgSummary || 'No organization data provided — use only what is in the user prompt.'}

WRITING STYLE:
${style}

ABSOLUTE RULES:
1. Never invent facts, statistics, names, EINs, UEIs, license numbers, or certifications.
2. If a required fact is not in the organization context, write [NEEDS ADMIN INPUT: description of what is needed].
3. Do not use phrases like "we are committed to" unless followed by a specific, verifiable action.
4. Do not use superlatives (best, leading, premier, cutting-edge).
5. Do not use filler phrases (it is important to note, it should be mentioned that, etc.).
6. Write in first person plural (we, our) from the organization's perspective.
7. Every claim must be supportable by the organization context provided.
8. Return only the narrative text — no preamble, no meta-commentary.`;
}

export function buildHumanizationPrompt(
  control: HumanizationControl,
  currentText: string,
): string {
  return `${HUMANIZATION_PROMPTS[control]}

Current text:
"""
${currentText}
"""

Return only the revised text. No explanation.`;
}

// ── Field detection patterns ──────────────────────────────────────────────────
// Used to detect blank fields in uploaded contract/template text.

export interface DetectedField {
  label: string;
  field_key: string;
  field_type: 'text' | 'date' | 'number' | 'checkbox' | 'signature' | 'currency' | 'textarea';
  context_snippet: string;
  confidence: number;
  sort_order: number;
}

const FIELD_DETECTION_PATTERNS: Array<{
  pattern: RegExp;
  field_key: string;
  label: string;
  field_type: DetectedField['field_type'];
}> = [
  { pattern: /legal\s+name\s*[:\-_]+\s*_{3,}/i,          field_key: 'legal_name',              label: 'Legal Name',              field_type: 'text' },
  { pattern: /organization\s+name\s*[:\-_]+\s*_{3,}/i,   field_key: 'legal_name',              label: 'Organization Name',       field_type: 'text' },
  { pattern: /dba\s*[:\-_]+\s*_{3,}/i,                   field_key: 'dba_name',                label: 'DBA Name',                field_type: 'text' },
  { pattern: /ein\s*[:\-_]+\s*_{3,}/i,                   field_key: 'ein',                     label: 'EIN',                     field_type: 'text' },
  { pattern: /employer\s+id\s*[:\-_]+\s*_{3,}/i,         field_key: 'ein',                     label: 'Employer ID (EIN)',       field_type: 'text' },
  { pattern: /uei\s*[:\-_]+\s*_{3,}/i,                   field_key: 'uei',                     label: 'UEI',                     field_type: 'text' },
  { pattern: /sam\s+registration\s*[:\-_]+\s*_{3,}/i,    field_key: 'sam_status',              label: 'SAM Registration Status', field_type: 'text' },
  { pattern: /address\s*[:\-_]+\s*_{3,}/i,               field_key: 'address',                 label: 'Address',                 field_type: 'text' },
  { pattern: /phone\s*[:\-_]+\s*_{3,}/i,                 field_key: 'phone',                   label: 'Phone',                   field_type: 'text' },
  { pattern: /email\s*[:\-_]+\s*_{3,}/i,                 field_key: 'email',                   label: 'Email',                   field_type: 'text' },
  { pattern: /website\s*[:\-_]+\s*_{3,}/i,               field_key: 'website',                 label: 'Website',                 field_type: 'text' },
  { pattern: /executive\s+director\s*[:\-_]+\s*_{3,}/i,  field_key: 'executive_director',      label: 'Executive Director',      field_type: 'text' },
  { pattern: /authorized\s+signer\s*[:\-_]+\s*_{3,}/i,   field_key: 'authorized_signer',       label: 'Authorized Signer',       field_type: 'text' },
  { pattern: /title\s*[:\-_]+\s*_{3,}/i,                 field_key: 'authorized_signer_title', label: 'Title',                   field_type: 'text' },
  { pattern: /date\s*[:\-_]+\s*_{3,}/i,                  field_key: 'signature_date',          label: 'Date',                    field_type: 'date' },
  { pattern: /signature\s*[:\-_]+\s*_{3,}/i,             field_key: 'signature',               label: 'Signature',               field_type: 'signature' },
  { pattern: /total\s+budget\s*[:\-_]+\s*_{3,}/i,        field_key: 'budget_total',            label: 'Total Budget',            field_type: 'currency' },
  { pattern: /award\s+amount\s*[:\-_]+\s*_{3,}/i,        field_key: 'award_amount',            label: 'Award Amount',            field_type: 'currency' },
  { pattern: /program\s+name\s*[:\-_]+\s*_{3,}/i,        field_key: 'program_name',            label: 'Program Name',            field_type: 'text' },
  { pattern: /project\s+title\s*[:\-_]+\s*_{3,}/i,       field_key: 'project_title',           label: 'Project Title',           field_type: 'text' },
  { pattern: /counties?\s+served\s*[:\-_]+\s*_{3,}/i,    field_key: 'counties_served',         label: 'Counties Served',         field_type: 'text' },
  { pattern: /number\s+of\s+participants\s*[:\-_]+/i,    field_key: 'annual_participants',     label: 'Number of Participants',  field_type: 'number' },
  { pattern: /mission\s+statement\s*[:\-_]+/i,           field_key: 'mission_statement',       label: 'Mission Statement',       field_type: 'textarea' },
  { pattern: /scope\s+of\s+work\s*[:\-_]+/i,             field_key: 'scope_of_work',           label: 'Scope of Work',           field_type: 'textarea' },
  { pattern: /project\s+description\s*[:\-_]+/i,         field_key: 'program_description',     label: 'Project Description',     field_type: 'textarea' },
  { pattern: /budget\s+justification\s*[:\-_]+/i,        field_key: 'budget_justification',    label: 'Budget Justification',    field_type: 'textarea' },
  { pattern: /sustainability\s+plan\s*[:\-_]+/i,         field_key: 'sustainability_plan',     label: 'Sustainability Plan',     field_type: 'textarea' },
  { pattern: /target\s+population\s*[:\-_]+/i,           field_key: 'target_population',       label: 'Target Population',       field_type: 'textarea' },
  { pattern: /need\s+statement\s*[:\-_]+/i,              field_key: 'need_statement',          label: 'Need Statement',          field_type: 'textarea' },
  { pattern: /past\s+performance\s*[:\-_]+/i,            field_key: 'past_performance',        label: 'Past Performance',        field_type: 'textarea' },
  { pattern: /outcomes?\s*[:\-_]+/i,                     field_key: 'outcomes',                label: 'Outcomes',                field_type: 'textarea' },
  { pattern: /staffing\s+plan\s*[:\-_]+/i,               field_key: 'staffing_plan',           label: 'Staffing Plan',           field_type: 'textarea' },
];

export function detectFieldsFromText(text: string): DetectedField[] {
  const lines = text.split('\n');
  const detected: DetectedField[] = [];
  const seen = new Set<string>();

  lines.forEach((line, lineIdx) => {
    for (const { pattern, field_key, label, field_type } of FIELD_DETECTION_PATTERNS) {
      if (pattern.test(line) && !seen.has(field_key)) {
        seen.add(field_key);
        const context = lines.slice(Math.max(0, lineIdx - 1), lineIdx + 2).join(' ').trim();
        detected.push({
          label,
          field_key,
          field_type,
          context_snippet: context.slice(0, 200),
          confidence: 0.85,
          sort_order: detected.length,
        });
      }
    }
  });

  return detected;
}

// ── Narrative field keys (AI-generated, always needs review) ─────────────────

export const NARRATIVE_FIELD_KEYS = new Set(Object.keys(NARRATIVE_FIELD_PROMPTS));

export function isNarrativeField(fieldKey: string): boolean {
  return NARRATIVE_FIELD_KEYS.has(fieldKey) ||
    ['scope_of_work', 'program_description', 'target_population',
     'need_statement', 'sustainability_plan', 'budget_justification',
     'outcomes', 'staffing_plan', 'compliance_approach', 'equity_access',
     'past_performance', 'executive_summary', 'organizational_background',
     'mission_statement', 'project_description', 'project_title',
    ].includes(fieldKey);
}
