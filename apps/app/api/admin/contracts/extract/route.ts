/**
 * POST /api/admin/contracts/extract
 *
 * Extracts text and detects blank fields from an uploaded contract template.
 * Uses pdf-parse, mammoth, and tesseract.js (same engine as /api/admin/documents/extract).
 * Saves detected fields to contract_template_fields.
 * Updates contract_templates.status to 'extracted'.
 *
 * Body: { contract_id: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { hydrateProcessEnv } from '@/lib/secrets';

import { detectFieldsFromText } from '@/lib/contracts/response-style';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function extractText(buffer: Buffer, mimeType: string): Promise<{ text: string; method: string }> {
  const mime = mimeType.toLowerCase();

  if (mime.includes('pdf')) {
    try {
      const pdfParse = await import('pdf-parse').then(m => m.default ?? m);
      const result = await pdfParse(buffer);
      const text = result.text?.trim() ?? '';
      if (text.length > 50) return { text, method: 'pdf-parse' };
    } catch { /* fall through */ }

    // OCR fallback for scanned PDFs
    try {
      const Tesseract = await import('tesseract.js').catch(() => null);
      if (!Tesseract) return { text: '', method: 'ocr_unavailable' };
      const images: Buffer[] = [];
      let offset = 0;
      while (offset < buffer.length - 2 && images.length < 8) {
        const start = buffer.indexOf(Buffer.from([0xff, 0xd8, 0xff]), offset);
        if (start === -1) break;
        const end = buffer.indexOf(Buffer.from([0xff, 0xd9]), start + 2);
        if (end === -1) break;
        const img = buffer.slice(start, end + 2);
        if (img.length > 5 * 1024) images.push(img);
        offset = end + 2;
      }
      if (images.length === 0) return { text: '', method: 'ocr_no_images' };
      const worker = await Tesseract.createWorker('eng');
      const texts: string[] = [];
      try {
        for (const img of images) {
          const { data } = await worker.recognize(img);
          if (data.text.trim().length > 20) texts.push(data.text.trim());
        }
      } finally {
        await worker.terminate();
      }
      return { text: texts.join('\n\n'), method: 'ocr' };
    } catch {
      return { text: '', method: 'ocr_failed' };
    }
  }

  if (mime.includes('wordprocessingml') || mime.includes('msword')) {
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return { text: result.value.trim(), method: 'mammoth' };
    } catch {
      return { text: '', method: 'mammoth_failed' };
    }
  }

  if (mime.includes('text/') || mime.includes('csv')) {
    return { text: buffer.toString('utf-8').trim(), method: 'text' };
  }

  return { text: '', method: 'unsupported' };
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  await hydrateProcessEnv();

  let body: { contract_id?: string };
  try { body = await request.json(); } catch { return safeError('Invalid JSON', 400); }
  if (!body.contract_id) return safeError('contract_id is required', 400);

  const db = await requireAdminClient();
  const storage = db;

  const { data: template, error: tErr } = await db
    .from('contract_templates')
    .select('id, original_file_path, file_type, file_name')
    .eq('id', body.contract_id)
    .maybeSingle();

  if (tErr || !template) return safeError('Contract not found', 404);
  if (!template.original_file_path) return safeError('No file path on record', 422);

  // Mark as extracting
  await db.from('contract_templates').update({ status: 'extracting' }).eq('id', body.contract_id);

  try {
    // Download from private storage
    const { data: fileData, error: dlErr } = await storage.storage
      .from('contracts')
      .download(template.original_file_path);

    if (dlErr || !fileData) {
      await db.from('contract_templates').update({ status: 'uploaded' }).eq('id', body.contract_id);
      return safeError('Could not download file from storage', 422);
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const { text, method } = await extractText(buffer, template.file_type ?? '');

    // Detect fields
    const detectedFields = text ? detectFieldsFromText(text) : [];

    // Save raw text + update status
    await db.from('contract_templates').update({
      raw_text: text || null,
      extraction_method: method,
      status: 'extracted',
      updated_at: new Date().toISOString(),
    }).eq('id', body.contract_id);

    // Delete old detected fields, insert new ones
    await db.from('contract_template_fields').delete().eq('contract_template_id', body.contract_id);

    if (detectedFields.length > 0) {
      await db.from('contract_template_fields').insert(
        detectedFields.map(f => ({
          contract_template_id: body.contract_id,
          label: f.label,
          field_key: f.field_key,
          field_type: f.field_type,
          context_snippet: f.context_snippet,
          confidence: f.confidence,
          sort_order: f.sort_order,
          source: 'detected',
        }))
      );
    }

    // Audit
    await db.from('contract_audit_logs').insert({
      actor_id: auth.id ?? null,
      action: 'extract',
      entity_type: 'contract_template',
      entity_id: body.contract_id,
      after_json: { method, field_count: detectedFields.length, text_length: text.length },
      ip_address: request.headers.get('x-forwarded-for') ?? null,
    });

    return NextResponse.json({
      ok: true,
      extraction_method: method,
      field_count: detectedFields.length,
      text_length: text.length,
      fields: detectedFields,
    });
  } catch (err) {
    await db.from('contract_templates').update({ status: 'uploaded' }).eq('id', body.contract_id);
    return safeInternalError(err, 'Extraction failed');
  }
}
