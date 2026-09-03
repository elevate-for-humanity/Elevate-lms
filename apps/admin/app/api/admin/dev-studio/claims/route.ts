import { NextRequest, NextResponse } from 'next/server';

import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { DEV_STUDIO_LANGUAGE_COUNT } from '@/lib/devstudio/language-registry';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

async function benchmarkSummary(db: Awaited<ReturnType<typeof requireAdminClient>>) {
  const { data } = await db
    .from('dev_studio_benchmarks')
    .select('speedup, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  const speedups = (data ?? [])
    .map((row) => Number(row.speedup))
    .filter((value) => Number.isFinite(value) && value > 0);
  return {
    sampleCount: speedups.length,
    medianSpeedup: median(speedups),
    maxSpeedup: speedups.length ? Math.max(...speedups) : null,
  };
}

export async function GET(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  const [{ data: claims, error }, benchmarks] = await Promise.all([
    db.from('dev_studio_claim_evidence').select('*').order('claim_key'),
    benchmarkSummary(db),
  ]);
  if (error) return safeError('Failed to load Dev Studio claim evidence', 500);

  return NextResponse.json({
    ok: true,
    languageCount: DEV_STUDIO_LANGUAGE_COUNT,
    claims: claims ?? [],
    benchmarks,
  });
}

export async function POST(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? '');
  const db = await requireAdminClient();

  if (action === 'sync_code_claims') {
    const verified = DEV_STUDIO_LANGUAGE_COUNT >= 50;
    const { error } = await db
      .from('dev_studio_claim_evidence')
      .update({
        status: verified ? 'verified' : 'draft',
        value_numeric: DEV_STUDIO_LANGUAGE_COUNT,
        value_text: `${DEV_STUDIO_LANGUAGE_COUNT} maintained editor language modes`,
        evidence_summary: 'Verified from lib/devstudio/language-registry.ts and enforced by scripts/check-dev-studio-claims.mjs.',
        source: 'repository-ci',
        verified_at: verified ? new Date().toISOString() : null,
        verified_by: verified ? auth.id : null,
        updated_at: new Date().toISOString(),
      })
      .eq('claim_key', 'language_modes_50_plus');
    if (error) return safeError('Failed to sync Dev Studio code claims', 500);
    return NextResponse.json({ ok: true, languageCount: DEV_STUDIO_LANGUAGE_COUNT, verified });
  }

  if (action === 'record_benchmark') {
    const baselineSeconds = Number(body.baseline_seconds);
    const studioSeconds = Number(body.studio_seconds);
    const scenario = String(body.scenario ?? '').trim();
    if (!scenario || !(baselineSeconds > 0) || !(studioSeconds > 0)) {
      return safeError('scenario, baseline_seconds, and studio_seconds must be positive values', 400);
    }

    const { error: insertError } = await db.from('dev_studio_benchmarks').insert({
      scenario,
      baseline_seconds: baselineSeconds,
      studio_seconds: studioSeconds,
      notes: body.notes ? String(body.notes) : null,
      evidence_url: body.evidence_url ? String(body.evidence_url) : null,
      run_by: auth.id,
    });
    if (insertError) return safeError('Failed to record Dev Studio benchmark', 500);

    const summary = await benchmarkSummary(db);
    const verified = summary.sampleCount >= 10 && (summary.medianSpeedup ?? 0) >= 10;
    await db
      .from('dev_studio_claim_evidence')
      .update({
        status: verified ? 'verified' : 'draft',
        value_numeric: summary.medianSpeedup,
        value_text: summary.medianSpeedup ? `${summary.medianSpeedup.toFixed(2)}x median measured speedup` : null,
        evidence_summary: `${summary.sampleCount} benchmark sample(s); 10x claim requires at least 10 samples and median speedup >= 10x.`,
        source: 'dev_studio_benchmarks',
        verified_at: verified ? new Date().toISOString() : null,
        verified_by: verified ? auth.id : null,
        updated_at: new Date().toISOString(),
      })
      .eq('claim_key', 'productivity_10x');

    return NextResponse.json({ ok: true, benchmarks: summary, claimVerified: verified });
  }

  if (action === 'verify_external_evidence') {
    const claimKey = String(body.claim_key ?? '');
    if (!['soc2_certified', 'zero_downtime'].includes(claimKey)) {
      return safeError('Only external/runtime evidence claims may be verified with this action', 400);
    }
    const evidenceUrl = String(body.evidence_url ?? '').trim();
    const evidenceSummary = String(body.evidence_summary ?? '').trim();
    if (!evidenceUrl || !evidenceSummary) {
      return safeError('evidence_url and evidence_summary are required', 400);
    }
    const { error } = await db
      .from('dev_studio_claim_evidence')
      .update({
        status: 'verified',
        evidence_url: evidenceUrl,
        evidence_summary: evidenceSummary,
        value_text: body.value_text ? String(body.value_text) : null,
        source: claimKey === 'soc2_certified' ? 'external-auditor' : 'northflank-runtime',
        verified_at: new Date().toISOString(),
        verified_by: auth.id,
        expires_at: body.expires_at ? String(body.expires_at) : null,
        updated_at: new Date().toISOString(),
      })
      .eq('claim_key', claimKey);
    if (error) return safeError('Failed to verify Dev Studio claim evidence', 500);
    return NextResponse.json({ ok: true, claimKey });
  }

  return safeError('Unknown Dev Studio claim action', 400);
}
