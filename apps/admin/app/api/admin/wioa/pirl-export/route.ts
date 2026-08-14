/**
 * POST /api/admin/wioa/pirl-export
 * Triggers a PIRL fixed-width export for a given quarter, persists the job
 * to wioa_pirl_exports, and returns the export record with download URL.
 *
 * GET /api/admin/wioa/pirl-export
 * Lists past export jobs from wioa_pirl_exports.
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import os from 'node:os';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeDbError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { exportQuarterlyPirl } from '@/lib/wioa/pirl_exporter';
import { createSupabaseAdapter } from '@/lib/wioa/supabase_adapter';
import type { Quarter } from '@/lib/wioa/pirl_exporter';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// PIRL exports can take 30–60 s for large cohorts
export const maxDuration = 120;

const SCHEMA_PATH = path.join(process.cwd(), 'tools/wioa/schemas/eta9170_starter.json');
const QUARTER_RE = /^\d{4}Q[1-4]$/;

// ── GET: list past exports ────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();

  const { data, error } = await db
    .from('wioa_pirl_exports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return safeDbError(error, 'Failed to load export history');

  return NextResponse.json({ exports: data ?? [] });
}

// ── POST: run export ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = (await request.json().catch(() => null)) as {
    quarter?: string;
    schema_id?: string;
  } | null;

  if (!body?.quarter) return safeError('quarter is required (e.g. 2025Q3)', 400);
  if (!QUARTER_RE.test(body.quarter)) {
    return safeError('quarter must be in format YYYYQn (e.g. 2025Q3)', 400);
  }

  const quarter = body.quarter as Quarter;
  const schemaId = body.schema_id ?? 'ETA-9170-PY25';
  const db = await requireAdminClient();

  // Derive fiscal_year from quarter (e.g. 2025Q3 → 2025)
  const fiscalYear = parseInt(quarter.slice(0, 4), 10);

  // Create a pending job record
  const { data: job, error: createErr } = await db
    .from('wioa_pirl_exports')
    .insert({
      schema_id:   schemaId,
      quarter,
      fiscal_year: fiscalYear,
      status:      'running',
      created_by:  auth.id,
      exported_by: auth.id,
      started_at:  new Date().toISOString(),
    })
    .select()
    .single();

  if (createErr || !job) return safeDbError(createErr ?? new Error('Insert failed'), 'Failed to create export job');

  // Run the export — writes to a temp dir (always removed in finally)
  const outDir = path.join(os.tmpdir(), `pirl-${job.id}`);
  const filePrefix = 'elevate';
  const fs = await import('node:fs/promises');

  try {
    const adapter = createSupabaseAdapter();
    const result = await exportQuarterlyPirl(adapter, {
      schemaPath: SCHEMA_PATH,
      quarter,
      outputDir:  outDir,
      filePrefix,
    });

    // Upload the .txt file to Supabase Storage (wioa-exports bucket)
    const fileBytes = await fs.readFile(result.dataFilePath);
    const storagePath = `pirl/${quarter}/${path.basename(result.dataFilePath)}`;

    const { error: uploadErr } = await db.storage
      .from('wioa-exports')
      .upload(storagePath, fileBytes, {
        contentType: 'text/plain',
        upsert: true,
      });

    // Get a signed URL (valid 1 hour)
    let fileUrl: string | null = null;
    if (!uploadErr) {
      const { data: signed } = await db.storage
        .from('wioa-exports')
        .createSignedUrl(storagePath, 3600);
      fileUrl = signed?.signedUrl ?? null;
    }

    // Persist issues to wioa_pirl_export_issues
    const topIssues = [
      ...(result as unknown as { issues?: unknown[] }).issues ?? [],
    ];
    if (topIssues.length > 0) {
      // Read from the validation JSON instead
    }

    // Read validation report for issue rows
    const reportJson = JSON.parse(
      await (await import('node:fs/promises')).readFile(result.reportFilePath, 'utf8')
    );

    const issueRows = [
      ...(reportJson.topErrors ?? []),
      ...(reportJson.topWarnings ?? []),
    ].map((issue: {
      participantId: string;
      element: string;
      fieldName: string;
      severity: string;
      message: string;
      value: unknown;
    }) => ({
      export_id:      job.id,
      participant_id: issue.participantId,
      element:        issue.element,
      field_name:     issue.fieldName,
      severity:       issue.severity,
      message:        issue.message,
      value:          String(issue.value ?? ''),
    }));

    if (issueRows.length > 0) {
      await db.from('wioa_pirl_export_issues').insert(issueRows);
    }

    // Mark job complete — use both live columns and new columns
    await db
      .from('wioa_pirl_exports')
      .update({
        status:          'completed',
        record_count:    result.recordCount,
        error_count:     result.errorCount,
        warning_count:   result.warningCount,
        checksum_sha256: result.checksumSha256,
        file_path:       storagePath,
        file_url:        fileUrl,
        errors:          reportJson,   // live column
        report_json:     reportJson,   // new column (added by migration)
        exported_at:     new Date().toISOString(),
        completed_at:    new Date().toISOString(),
      })
      .eq('id', job.id);

    return NextResponse.json({
      export_id:    job.id,
      quarter,
      record_count: result.recordCount,
      error_count:  result.errorCount,
      warning_count: result.warningCount,
      checksum:     result.checksumSha256,
      file_url:     fileUrl,
      status:       'completed',
    });

  } catch (err) {
    // Mark job failed
    await db
      .from('wioa_pirl_exports')
      .update({
        status:       'failed',
        errors:       { error: String(err) },
        report_json:  { error: String(err) },
        exported_at:  new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    return safeInternalError(err, 'PIRL export failed');
  } finally {
    await fs.rm(outDir, { recursive: true, force: true }).catch(() => {});
  }
}
