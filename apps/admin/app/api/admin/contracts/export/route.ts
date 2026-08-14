/**
 * POST /api/admin/contracts/export
 *
 * Generates the final filled document from approved field values + signature.
 * Uses existing lib/documents/generate-signed-pdf.ts for PDF output.
 * Uses docx library for DOCX output.
 * Stores result in private 'contracts' storage bucket.
 * Creates contract_exports row.
 *
 * Body: { contract_id: string; run_id: string; export_type?: 'pdf' | 'docx' }
 *
 * Only approved_values are written into the document.
 * Signature is embedded if present.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { hydrateProcessEnv } from '@/lib/secrets';
import { generateSignedPDF } from '@/lib/documents/generate-signed-pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  await hydrateProcessEnv();

  let body: { contract_id?: string; run_id?: string; export_type?: 'pdf' | 'docx' };
  try { body = await request.json(); } catch { return safeError('Invalid JSON', 400); }

  const { contract_id, run_id } = body;
  const export_type = body.export_type ?? 'pdf';
  if (!contract_id || !run_id) return safeError('contract_id and run_id are required', 400);

  const db = await requireAdminClient();
  const storage = db;

  // Load template
  const { data: template } = await db
    .from('contract_templates')
    .select('id, title, original_file_path, file_type')
    .eq('id', contract_id)
    .maybeSingle();

  if (!template) return safeError('Contract not found', 404);

  // Load prefill run
  const { data: run } = await db
    .from('contract_prefill_runs')
    .select('id, status, approved_values, field_metadata')
    .eq('id', run_id)
    .eq('contract_template_id', contract_id)
    .maybeSingle();

  if (!run) return safeError('Prefill run not found', 404);
  if (!['approved', 'in_review'].includes(run.status ?? '')) {
    return safeError('Prefill run must be approved before export', 422);
  }

  // Load signature if present
  const { data: sigFields } = await db
    .from('contract_signature_fields')
    .select('*')
    .eq('contract_template_id', contract_id)
    .eq('prefill_run_id', run_id)
    .order('created_at', { ascending: false })
    .limit(1);

  const sig = sigFields?.[0];
  const approvedValues = (run.approved_values as Record<string, string>) ?? {};

  // Create export record
  const { data: exportRow, error: exportErr } = await db
    .from('contract_exports')
    .insert({
      contract_template_id: contract_id,
      prefill_run_id: run_id,
      export_type,
      status: 'generating',
      created_by: auth.id ?? null,
    })
    .select('id')
    .single();

  if (exportErr || !exportRow) return safeInternalError(exportErr, 'Failed to create export record');

  try {
    let fileBuffer: Buffer;
    let contentType: string;
    let fileExt: string;

    if (export_type === 'pdf') {
      // Download original PDF template if available
      let pdfTemplateBytes: Uint8Array | undefined;
      if (template.original_file_path && template.file_type?.includes('pdf')) {
        const { data: fileData } = await storage.storage
          .from('contracts')
          .download(template.original_file_path);
        if (fileData) {
          pdfTemplateBytes = new Uint8Array(await fileData.arrayBuffer());
        }
      }

      const pdfBytes = await generateSignedPDF({
        documentTitle: template.title,
        pdfTemplateBytes,
        fieldValues: approvedValues,
        signerName: sig?.signer_name ?? approvedValues['authorized_signer'] ?? 'Authorized Signer',
        signerEmail: sig?.signer_email ?? approvedValues['email'] ?? '',
        signatureData: sig?.signature_data ?? undefined,
        typedName: sig?.typed_name ?? undefined,
        signatureType: (sig?.signature_type as 'draw' | 'typed') ?? 'typed',
        signedAt: sig?.signed_at ?? new Date().toISOString(),
        ipAddress: sig?.ip_address ?? undefined,
      });

      fileBuffer = Buffer.from(pdfBytes);
      contentType = 'application/pdf';
      fileExt = 'pdf';
    } else {
      // DOCX export
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');

      const sections = Object.entries(approvedValues).map(([key, value]) => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        return [
          new Paragraph({ text: label, heading: HeadingLevel.HEADING_3 }),
          new Paragraph({ children: [new TextRun({ text: value, size: 24 })] }),
          new Paragraph({ text: '' }),
        ];
      }).flat();

      if (sig?.signer_name) {
        sections.push(
          new Paragraph({ text: 'Signature', heading: HeadingLevel.HEADING_3 }),
          new Paragraph({ children: [new TextRun({ text: `Signed by: ${sig.signer_name}` })] }),
          new Paragraph({ children: [new TextRun({ text: `Title: ${sig.signer_title ?? ''}` })] }),
          new Paragraph({ children: [new TextRun({ text: `Date: ${sig.signed_at ? new Date(sig.signed_at).toLocaleDateString() : ''}` })] }),
        );
      }

      const doc = new Document({
        sections: [{ properties: {}, children: sections }],
      });

      fileBuffer = Buffer.from(await Packer.toBuffer(doc));
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      fileExt = 'docx';
    }

    // Upload to private storage
    const timestamp = Date.now();
    const exportPath = `exports/${contract_id}/${timestamp}-export.${fileExt}`;

    const { error: uploadErr } = await storage.storage
      .from('contracts')
      .upload(exportPath, fileBuffer, { contentType, upsert: false });

    if (uploadErr) throw uploadErr;

    // Update export record
    await db.from('contract_exports').update({
      exported_file_path: exportPath,
      status: 'ready',
      file_size: fileBuffer.length,
    }).eq('id', exportRow.id);

    // Generate signed download URL (1 hour)
    const { data: signedUrl } = await storage.storage
      .from('contracts')
      .createSignedUrl(exportPath, 3600);

    // Audit
    await db.from('contract_audit_logs').insert({
      actor_id: auth.id ?? null,
      action: 'export',
      entity_type: 'contract_export',
      entity_id: exportRow.id,
      after_json: { contract_id, run_id, export_type, file_size: fileBuffer.length },
      ip_address: request.headers.get('x-forwarded-for') ?? null,
    });

    return NextResponse.json({
      ok: true,
      export_id: exportRow.id,
      export_type,
      file_size: fileBuffer.length,
      download_url: signedUrl?.signedUrl ?? null,
      expires_in: '1 hour',
    });
  } catch (err) {
    await db.from('contract_exports').update({ status: 'failed' }).eq('id', exportRow.id);
    return safeInternalError(err, 'Export generation failed');
  }
}
