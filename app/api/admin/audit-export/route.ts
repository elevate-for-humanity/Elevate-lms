import { logger } from "@/lib/logger";
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/require-admin';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/audit-export
 *
 * Exports audit_logs rows since last export to Supabase Storage
 * as a JSONL file. Creates an offsite survivability copy that
 * persists independently of the audit_logs table.
 *
 * Requires admin/super_admin role.
 */
async function _POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  try {
    // Step 1: Get export snapshot metadata
    const { data: snapshot, error: snapError } = await supabase.rpc('export_audit_snapshot');
    if (snapError) {
      return NextResponse.json({ error: 'Snapshot failed' }, { status: 500 });
    }

    if (snapshot.status === 'no_new_rows') {
      return NextResponse.json({ status: 'no_new_rows', message: 'No new audit entries since last export' });
    }

    // Step 2: Fetch the actual rows
    const { data: rows, error: fetchError } = await supabase
      .from('audit_logs')
      .select('*')
      .gt('created_at', snapshot.from)
      .lte('created_at', snapshot.to)
      .order('created_at', { ascending: true });

    if (fetchError || !rows) {
      return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
    }

    // Step 3: Convert to JSONL (one JSON object per line)
    const jsonl = rows.map((r: Record<string, unknown>) => JSON.stringify(r)).join('\n');
    const blob = new Blob([jsonl], { type: 'application/jsonl' });

    // Step 4: Upload to Supabase Storage
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const storagePath = `audit-exports/${timestamp}.jsonl`;

    // Ensure bucket exists
    await supabase.storage.createBucket('audit-archive', {
      public: false,
      fileSizeLimit: 52428800, // 50MB
    });

    const { error: uploadError } = await supabase.storage
      .from('audit-archive')
      .upload(storagePath, blob, {
        contentType: 'application/jsonl',
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Step 5: Mark export as completed
    await supabase
      .from('audit_export_log')
      .update({ status: 'completed', storage_path: storagePath })
      .eq('id', snapshot.export_id);

    return NextResponse.json({
      status: 'exported',
      export_id: snapshot.export_id,
      rows_exported: snapshot.rows,
      storage_path: storagePath,
      checksum: snapshot.checksum,
      from: snapshot.from,
      to: snapshot.to,
    });
  } catch (e) {
    logger.error('Audit export failed', e instanceof Error ? e : undefined);
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/admin/audit-export', _POST);
