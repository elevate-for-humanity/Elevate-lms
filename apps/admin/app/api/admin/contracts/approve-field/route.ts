/**
 * POST /api/admin/contracts/approve-field
 *
 * Admin approves, edits, or rejects a single field value in a prefill run.
 * Only approved fields are written into the final exported document.
 *
 * Body: {
 *   run_id: string;
 *   field_key: string;
 *   action: 'approve' | 'edit' | 'reject' | 'humanize';
 *   value?: string;           // required for 'edit'
 *   humanize_control?: string; // required for 'humanize'
 * }
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { hydrateProcessEnv } from '@/lib/secrets';
import {
  type HumanizationControl,
  buildHumanizationPrompt,
} from '@/lib/contracts/response-style';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  await hydrateProcessEnv();

  let body: {
    run_id?: string;
    field_key?: string;
    action?: 'approve' | 'edit' | 'reject' | 'humanize';
    value?: string;
    humanize_control?: HumanizationControl;
  };
  try { body = await request.json(); } catch { return safeError('Invalid JSON', 400); }

  const { run_id, field_key, action } = body;
  if (!run_id || !field_key || !action) {
    return safeError('run_id, field_key, and action are required', 400);
  }

  const db = await requireAdminClient();

  const { data: run } = await db
    .from('contract_prefill_runs')
    .select('id, matched_values, approved_values, missing_values, field_metadata')
    .eq('id', run_id)
    .maybeSingle();

  if (!run) return safeError('Prefill run not found', 404);

  const matched = (run.matched_values as Record<string, string>) ?? {};
  const approved = (run.approved_values as Record<string, string>) ?? {};
  const missing = (run.missing_values as Record<string, string>) ?? {};
  const metadata = (run.field_metadata as Record<string, { source: string; confidence: number; ai_drafted: boolean; label: string }>) ?? {};

  const newApproved = { ...approved };
  const newMissing = { ...missing };
  const newMetadata = { ...metadata };
  let humanizedValue: string;

  if (action === 'approve') {
    const val = matched[field_key] ?? approved[field_key];
    if (!val) return safeError(`No value to approve for field: ${field_key}`, 422);
    newApproved[field_key] = val;
    delete newMissing[field_key];
    if (newMetadata[field_key]) {
      newMetadata[field_key] = { ...newMetadata[field_key], source: 'manual_admin_input' };
    }
  } else if (action === 'edit') {
    if (body.value === undefined) return safeError('value is required for edit action', 400);
    newApproved[field_key] = body.value;
    delete newMissing[field_key];
    newMetadata[field_key] = {
      ...(newMetadata[field_key] ?? {}),
      source: 'manual_admin_input',
      confidence: 1.0,
      ai_drafted: false,
      label: newMetadata[field_key]?.label ?? field_key,
    };
  } else if (action === 'reject') {
    delete newApproved[field_key];
    newMissing[field_key] = '';
    if (newMetadata[field_key]) {
      newMetadata[field_key] = { ...newMetadata[field_key], source: 'needs_admin_input' };
    }
  } else if (action === 'humanize') {
    if (!body.humanize_control) return safeError('humanize_control is required for humanize action', 400);
    const currentText = matched[field_key] ?? approved[field_key] ?? '';
    if (!currentText) return safeError('No text to humanize', 422);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return safeError('OpenAI API key not configured', 500);

    const prompt = buildHumanizationPrompt(body.humanize_control, currentText);
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.3,
      }),
    });

    if (!res.ok) return safeError('AI humanization failed', 502);
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    humanizedValue = data.choices?.[0]?.message?.content?.trim() ?? null;
    if (!humanizedValue) return safeError('AI returned empty response', 502);

    // Return humanized text for admin to review — don't auto-approve
    return NextResponse.json({ ok: true, action: 'humanize', field_key, humanized_value: humanizedValue });
  }

  const { error: updateErr } = await db
    .from('contract_prefill_runs')
    .update({
      approved_values: newApproved,
      missing_values: newMissing,
      field_metadata: newMetadata,
      updated_at: new Date().toISOString(),
    })
    .eq('id', run_id);

  if (updateErr) return safeInternalError(updateErr, 'Failed to update prefill run');

  // Audit
  await db.from('contract_audit_logs').insert({
    actor_id: auth.id ?? null,
    action: `${action}_field`,
    entity_type: 'prefill_run',
    entity_id: run_id,
    after_json: { field_key, action, value: action === 'edit' ? body.value : undefined },
    ip_address: request.headers.get('x-forwarded-for') ?? null,
  });

  return NextResponse.json({
    ok: true,
    action,
    field_key,
    approved_count: Object.keys(newApproved).length,
    missing_count: Object.keys(newMissing).length,
  });
}
