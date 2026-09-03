/**
 * POST /api/admin/contracts/prefill
 *
 * Runs prefill on a contract template:
 * 1. Loads org facts from sos_organization_facts (approved only)
 * 2. Resolves exact-data fields from org context
 * 3. Generates AI narrative drafts for narrative fields
 * 4. Marks missing fields as needs_admin_input
 * 5. Creates a contract_prefill_runs row
 *
 * Body: { contract_id: string; response_style?: ResponseStyleMode }
 *
 * AI rules:
 * - Exact fields (EIN, UEI, address, etc.) are NEVER AI-generated
 * - Narrative fields get AI drafts, flagged as ai_drafted_narrative
 * - Missing required facts → needs_admin_input, never hallucinated
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { hydrateProcessEnv } from '@/lib/secrets';
import {
  type ResponseStyleMode,
  type OrgContext,
  type FieldSource,
  resolveExactField,
  buildNarrativeSystemPrompt,
  NARRATIVE_FIELD_PROMPTS,
  EXACT_DATA_FIELDS,
  NEVER_AI_GENERATE,
  isNarrativeField,
} from '@/lib/contracts/response-style';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

async function generateNarrative(
  fieldKey: string,
  org: OrgContext,
  mode: ResponseStyleMode,
): Promise<string | null> {
  try {
    await hydrateProcessEnv();
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    const systemPrompt = buildNarrativeSystemPrompt(mode, org);
    const promptFn = NARRATIVE_FIELD_PROMPTS[fieldKey];
    const userPrompt = promptFn
      ? promptFn(org)
      : `Write a professional response for the field: "${fieldKey}". Use only facts from the organization context. Do not invent information.`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 800,
        temperature: 0.4,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  await hydrateProcessEnv();

  let body: { contract_id?: string; response_style?: ResponseStyleMode };
  try { body = await request.json(); } catch { return safeError('Invalid JSON', 400); }
  if (!body.contract_id) return safeError('contract_id is required', 400);

  const mode: ResponseStyleMode = body.response_style ?? 'state_contract_formal';
  const db = await requireAdminClient();

  // Load template + fields
  const { data: template } = await db
    .from('contract_templates')
    .select('id, title, status')
    .eq('id', body.contract_id)
    .maybeSingle();

  if (!template) return safeError('Contract not found', 404);
  if (!['extracted', 'prefilling', 'review'].includes(template.status ?? '')) {
    return safeError('Contract must be extracted before prefill. Run /api/admin/contracts/extract first.', 422);
  }

  const { data: fields } = await db
    .from('contract_template_fields')
    .select('field_key, label, field_type, required')
    .eq('contract_template_id', body.contract_id)
    .order('sort_order');

  if (!fields?.length) return safeError('No fields detected. Run extraction first.', 422);

  // Load org context from sos_organizations + sos_organization_facts
  // Note: sos_organizations uses address_line_1/2, state, zip (not address_line1, state_code, zip_code)
  const { data: orgs } = await db
    .from('sos_organizations')
    .select(`
      id, legal_name, dba_name, ein, uei, sam_status,
      address_line_1, address_line_2, city, state, zip,
      phone, general_email, website,
      authorized_signatory_name, authorized_signatory_title,
      sos_organization_profiles (
        mission_statement, org_overview, target_populations,
        counties_served, years_in_operation, staff_count,
        insurance_status, audit_status
      )
    `)
    .order('created_at', { ascending: true })
    .limit(1);

  const orgRow = orgs?.[0] as Record<string, unknown> | undefined;
  const profile = (orgRow?.sos_organization_profiles as Record<string, unknown>[] | undefined)?.[0] as Record<string, unknown> | undefined;

  // Load facts filtered to this org to avoid cross-org duplicates
  const { data: rawFacts } = orgRow?.id
    ? await db
        .from('sos_organization_facts')
        .select('fact_key, fact_value_json, status')
        .eq('organization_id', orgRow.id as string)
        .eq('status', 'approved')
    : { data: [] };

  // Build approved facts map — normalise "org.ein" → "ein" style aliases
  const approvedFacts: Record<string, string> = {};
  for (const f of (rawFacts ?? [])) {
    const val = typeof f.fact_value_json === 'string'
      ? f.fact_value_json
      : JSON.stringify(f.fact_value_json);
    approvedFacts[f.fact_key] = val;
    // Also store without "org." prefix so resolveExactField can find them
    if (f.fact_key.startsWith('org.')) {
      approvedFacts[f.fact_key.slice(4)] = val;
    }
  }

  const address = [
    orgRow?.address_line_1,
    orgRow?.address_line_2,
    orgRow?.city,
    orgRow?.state,
    orgRow?.zip,
  ].filter(Boolean).join(', ');

  // authorized_signatory_name/title from sos_organizations takes precedence over facts
  const signerName = (orgRow?.authorized_signatory_name as string | null)
    ?? approvedFacts['authorized_signer']
    ?? undefined;
  const signerTitle = (orgRow?.authorized_signatory_title as string | null)
    ?? approvedFacts['authorized_signer_title']
    ?? undefined;

  const org: OrgContext = {
    legal_name: orgRow?.legal_name as string | undefined,
    dba_name: orgRow?.dba_name as string | undefined,
    ein: orgRow?.ein as string | undefined,
    uei: orgRow?.uei as string | undefined,
    sam_status: orgRow?.sam_status as string | undefined,
    address: address || undefined,
    phone: orgRow?.phone as string | undefined,
    email: orgRow?.general_email as string | undefined,
    website: orgRow?.website as string | undefined,
    mission_statement: profile?.mission_statement as string | undefined,
    org_overview: profile?.org_overview as string | undefined,
    target_populations: profile?.target_populations as string | undefined,
    counties_served: profile?.counties_served as string[] | undefined,
    years_in_operation: profile?.years_in_operation as number | undefined,
    staff_count: profile?.staff_count as number | undefined,
    insurance_status: profile?.insurance_status as string | undefined,
    audit_status: profile?.audit_status as string | undefined,
    authorized_signer: signerName,
    authorized_signer_title: signerTitle,
    executive_director: approvedFacts['executive_director'],
    annual_participants: approvedFacts['annual_participants']
      ? parseInt(approvedFacts['annual_participants']) : undefined,
    placement_rate: approvedFacts['placement_rate'],
    completion_rate: approvedFacts['completion_rate'],
    programs: approvedFacts['programs']
      ? JSON.parse(approvedFacts['programs']) : undefined,
    facts: approvedFacts,
  };

  // Mark as prefilling
  await db.from('contract_templates').update({ status: 'prefilling' }).eq('id', body.contract_id);

  const matched_values: Record<string, string> = {};
  const missing_values: Record<string, string> = {};
  const field_metadata: Record<string, {
    source: FieldSource;
    confidence: number;
    ai_drafted: boolean;
    label: string;
  }> = {};

  for (const field of fields) {
    const key = field.field_key;

    // Never AI-generate these — always needs_admin_input if missing
    if (NEVER_AI_GENERATE.has(key)) {
      const { value, source } = resolveExactField(key, org);
      if (value) {
        matched_values[key] = value;
        field_metadata[key] = { source, confidence: 1.0, ai_drafted: false, label: field.label };
      } else {
        missing_values[key] = '';
        field_metadata[key] = { source: 'needs_admin_input', confidence: 0, ai_drafted: false, label: field.label };
      }
      continue;
    }

    // Exact data fields — resolve from org context
    if (EXACT_DATA_FIELDS.has(key)) {
      const { value, source } = resolveExactField(key, org);
      if (value) {
        matched_values[key] = value;
        field_metadata[key] = { source, confidence: 1.0, ai_drafted: false, label: field.label };
      } else {
        missing_values[key] = '';
        field_metadata[key] = { source: 'needs_admin_input', confidence: 0, ai_drafted: false, label: field.label };
      }
      continue;
    }

    // Narrative fields — AI draft
    if (isNarrativeField(key)) {
      const draft = await generateNarrative(key, org, mode);
      if (draft) {
        matched_values[key] = draft;
        field_metadata[key] = { source: 'ai_drafted_narrative', confidence: 0.7, ai_drafted: true, label: field.label };
      } else {
        missing_values[key] = '';
        field_metadata[key] = { source: 'needs_admin_input', confidence: 0, ai_drafted: false, label: field.label };
      }
      continue;
    }

    // Unknown field — try exact resolution, then mark missing
    const { value, source } = resolveExactField(key, org);
    if (value) {
      matched_values[key] = value;
      field_metadata[key] = { source, confidence: 0.8, ai_drafted: false, label: field.label };
    } else {
      missing_values[key] = '';
      field_metadata[key] = { source: 'needs_admin_input', confidence: 0, ai_drafted: false, label: field.label };
    }
  }

  // Create prefill run
  const { data: run, error: runErr } = await db
    .from('contract_prefill_runs')
    .insert({
      contract_template_id: body.contract_id,
      status: 'draft',
      response_style: mode,
      matched_values,
      missing_values,
      approved_values: {},
      field_metadata,
      created_by: auth.id ?? null,
    })
    .select('id, status, created_at')
    .single();

  if (runErr || !run) return safeInternalError(runErr, 'Failed to create prefill run');

  await db.from('contract_templates').update({ status: 'review' }).eq('id', body.contract_id);

  // Audit
  await db.from('contract_audit_logs').insert({
    actor_id: auth.id ?? null,
    action: 'prefill',
    entity_type: 'prefill_run',
    entity_id: run.id,
    after_json: {
      contract_id: body.contract_id,
      mode,
      matched_count: Object.keys(matched_values).length,
      missing_count: Object.keys(missing_values).length,
    },
    ip_address: request.headers.get('x-forwarded-for') ?? null,
  });

  return NextResponse.json({
    ok: true,
    run_id: run.id,
    matched_count: Object.keys(matched_values).length,
    missing_count: Object.keys(missing_values).length,
    ai_drafted_count: Object.values(field_metadata).filter(m => m.ai_drafted).length,
    matched_values,
    missing_values,
    field_metadata,
  });
}
