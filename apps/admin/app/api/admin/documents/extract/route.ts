/**
 * POST /api/admin/documents/extract
 *
 * Extracts structured fields from a document already stored in Supabase Storage.
 * Reuses the parse-file text extraction engine (pdf-parse, mammoth, tesseract.js).
 * Saves results to documents.extracted_data, ocr_text, extraction_status.
 * Auto-applies extracted fields to the linked application record if application_id is set.
 *
 * Body: { document_id: string }
 * Returns: { extracted_data, ocr_text, extraction_method, auto_applied, fields_applied }
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { hydrateProcessEnv } from '@/lib/secrets';
import {
  analyzeDocument,
  toExtractedFields,
  isDocumentIntelligenceAvailable,
} from '@/lib/ai/azure-document-intelligence';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ── Structured field extraction ───────────────────────────────────────────────
// Runs regex patterns over extracted text to pull common document fields.
// No LLM — deterministic, auditable, no external calls.

const PATTERNS: Record<string, RegExp> = {
  person_name:    /(?:name|applicant|student|participant)[:\s]+([A-Z][a-z]+(?: [A-Z][a-z]+)+)/i,
  email:          /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/,
  phone:          /\b(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})\b/,
  dob:            /(?:date of birth|dob|born)[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
  address:        /(?:address)[:\s]+([0-9]+[^,\n]+(?:,\s*[A-Z]{2}\s*\d{5})?)/i,
  ein:            /\b(\d{2}-\d{7})\b/,
  uei:            /\bUEI[:\s]+([A-Z0-9]{12})\b/i,
  grant_number:   /(?:grant|opportunity|award)\s*(?:number|no\.?|#)[:\s]+([A-Z0-9-]+)/i,
  cfda_number:    /\bCFDA[:\s]+(\d{2}\.\d{3})\b/i,
  org_name:       /(?:organization|agency|entity|applicant organization)[:\s]+([A-Z][^\n,]{3,60})/i,
  program_name:   /(?:program|project)[:\s]+([A-Z][^\n,]{3,80})/i,
  employer:       /(?:employer|company)[:\s]+([A-Z][^\n,]{3,60})/i,
  income:         /(?:income|salary|wage)[:\s]+\$?([\d,]+(?:\.\d{2})?)/i,
  education:      /(?:education|degree|diploma)[:\s]+([^\n,]{3,60})/i,
  budget_total:   /(?:total budget|budget total|award amount)[:\s]+\$?([\d,]+(?:\.\d{2})?)/i,
  deadline:       /(?:deadline|due date|close date)[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
  signature_date: /(?:signed|signature date)[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
};

function extractFields(text: string): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const [key, pattern] of Object.entries(PATTERNS)) {
    const match = text.match(pattern);
    if (match?.[1]) {
      fields[key] = match[1].trim();
    }
  }
  return fields;
}

// ── Text extraction (mirrors parse-file logic, operates on Buffer) ────────────

async function extractText(buffer: Buffer, mimeType: string): Promise<{
  text: string;
  method: string;
  confidence: number | null;
}> {
  const mime = mimeType.toLowerCase();

  // PDF
  if (mime.includes('pdf')) {
    try {
      const pdfParse = await import('pdf-parse').then(m => m.default ?? m);
      const result = await pdfParse(buffer);
      const text = result.text?.trim() ?? '';
      if (text.length > 50) {
        return { text, method: 'pdf-parse', confidence: null };
      }
      // Sparse text — likely scanned, attempt OCR
    } catch { /* fall through to OCR */ }

    // OCR fallback for scanned PDFs
    try {
      const Tesseract = await import('tesseract.js').catch(() => null);
      if (!Tesseract) return { text: '', method: 'ocr_unavailable', confidence: null };

      // Extract embedded JPEG streams
      const images: Buffer[] = [];
      let offset = 0;
      while (offset < buffer.length - 2 && images.length < 6) {
        const start = buffer.indexOf(Buffer.from([0xff, 0xd8, 0xff]), offset);
        if (start === -1) break;
        const end = buffer.indexOf(Buffer.from([0xff, 0xd9]), start + 2);
        if (end === -1) break;
        const img = buffer.slice(start, end + 2);
        if (img.length > 10 * 1024) images.push(img);
        offset = end + 2;
      }
      if (images.length === 0) return { text: '', method: 'ocr_no_images', confidence: null };

      const worker = await Tesseract.createWorker('eng');
      const texts: string[] = [];
      let totalConf = 0;
      try {
        for (const img of images) {
          const { data } = await worker.recognize(img);
          if (data.text.trim().length > 20) {
            texts.push(data.text.trim());
            totalConf += data.confidence;
          }
        }
      } finally {
        await worker.terminate();
      }
      const combined = texts.join('\n\n');
      const confidence = texts.length > 0 ? totalConf / texts.length / 100 : null;
      return { text: combined, method: 'ocr', confidence };
    } catch {
      return { text: '', method: 'ocr_failed', confidence: null };
    }
  }

  // DOCX
  if (mime.includes('wordprocessingml') || mime.includes('msword') || mime.includes('docx')) {
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return { text: result.value.trim(), method: 'mammoth', confidence: null };
    } catch {
      return { text: '', method: 'mammoth_failed', confidence: null };
    }
  }

  // Plain text / CSV / markdown
  if (mime.includes('text/') || mime.includes('csv') || mime.includes('markdown')) {
    return { text: buffer.toString('utf-8').trim(), method: 'text', confidence: null };
  }

  // Images — OCR directly
  if (mime.startsWith('image/')) {
    try {
      const Tesseract = await import('tesseract.js').catch(() => null);
      if (!Tesseract) return { text: '', method: 'ocr_unavailable', confidence: null };
      const worker = await Tesseract.createWorker('eng');
      try {
        const { data } = await worker.recognize(buffer);
        return {
          text: data.text.trim(),
          method: 'ocr_image',
          confidence: data.confidence / 100,
        };
      } finally {
        await worker.terminate();
      }
    } catch {
      return { text: '', method: 'ocr_failed', confidence: null };
    }
  }

  return { text: '', method: 'unsupported', confidence: null };
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  await hydrateProcessEnv();

  let body: { document_id?: string };
  try {
    body = await request.json();
  } catch {
    return safeError('Invalid JSON body', 400);
  }

  const { document_id } = body;
  if (!document_id) return safeError('document_id is required', 400);

  const db = await requireAdminClient();

  // Load document record — include application_id and user_id for auto-apply
  const { data: doc, error: docErr } = await db
    .from('documents')
    .select('id, file_path, file_url, url, mime_type, document_type, file_name, application_id, user_id')
    .eq('id', document_id)
    .maybeSingle();

  if (docErr || !doc) return safeError('Document not found', 404);

  // Mark as processing
  await db
    .from('documents')
    .update({ extraction_status: 'processing' })
    .eq('id', document_id);

  try {
    // Resolve file URL
    const fileUrl = doc.file_url || doc.url;
    if (!fileUrl) {
      await db.from('documents').update({ extraction_status: 'failed' }).eq('id', document_id);
      return safeError('Document has no file URL', 422);
    }

    // Fetch file bytes
    const fileRes = await fetch(fileUrl);
    if (!fileRes.ok) {
      await db.from('documents').update({ extraction_status: 'failed' }).eq('id', document_id);
      return safeError(`Could not fetch file: HTTP ${fileRes.status}`, 422);
    }
    const arrayBuf = await fileRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    const mimeType = doc.mime_type || doc.document_type || '';

    // ── Azure Document Intelligence (preferred) ───────────────────────────────
    // Uses Azure's pre-built models for structured field extraction.
    // Falls back to local regex OCR if Azure is not configured.
    let fields: Record<string, string> = {};
    let text = '';
    let method = 'regex';
    let confidence = 0;

    if (isDocumentIntelligenceAvailable()) {
      try {
        const diResult = await analyzeDocument(fileUrl, doc.document_type || 'general');
        fields = toExtractedFields(diResult);
        text = diResult.rawText;
        method = `azure-document-intelligence:${diResult.modelId}`;
        confidence = diResult.confidence;
      } catch (diErr) {
        // Azure failed — fall through to local OCR
        const { text: ocrText, method: ocrMethod, confidence: ocrConf } = await extractText(buffer, mimeType);
        text = ocrText;
        method = ocrMethod;
        confidence = ocrConf;
        fields = text ? extractFields(text) : {};
      }
    } else {
      // Local regex OCR
      const extracted = await extractText(buffer, mimeType);
      text = extracted.text;
      method = extracted.method;
      confidence = extracted.confidence;
      fields = text ? extractFields(text) : {};
    }

    const extracted_data = {
      fields,
      source: method,
      word_count: text ? text.split(/\s+/).filter(Boolean).length : 0,
      char_count: text.length,
      extracted_at: new Date().toISOString(),
    };

    // Save to documents table
    const { error: updateErr } = await db
      .from('documents')
      .update({
        ocr_text: text || null,
        ocr_confidence: confidence,
        extracted_data,
        extraction_status: 'extracted',
        processed_at: new Date().toISOString(),
        processed_by: auth.id ?? null,
      })
      .eq('id', document_id);

    if (updateErr) {
      return safeInternalError(updateErr, 'Failed to save extraction results');
    }

    // ── Auto-apply extracted fields to linked application ─────────────────────
    // If the document is linked to an application, map known fields directly
    // onto the applications row. Only overwrites null/empty columns.
    let auto_applied = false;
    const fields_applied: string[] = [];

    if (doc.application_id && Object.keys(fields).length > 0) {
      try {
        // Fetch current application to avoid overwriting existing data
        const { data: app } = await db
          .from('applications')
          .select('*')
          .eq('id', doc.application_id)
          .maybeSingle();

        if (app) {
          // Map OCR fields → application columns (only fill blanks)
          const patch: Record<string, string> = {};

          const maybeSet = (col: string, val: string | undefined) => {
            if (val && (app[col] === null || app[col] === undefined || app[col] === '')) {
              patch[col] = val;
              fields_applied.push(col);
            }
          };

          maybeSet('applicant_name',  fields.person_name);
          maybeSet('email',           fields.email);
          maybeSet('phone',           fields.phone);
          maybeSet('date_of_birth',   fields.dob);
          maybeSet('address',         fields.address);
          maybeSet('employer_name',   fields.employer);
          maybeSet('income',          fields.income);
          maybeSet('education_level', fields.education);
          maybeSet('org_name',        fields.org_name);
          maybeSet('program_name',    fields.program_name);

          if (Object.keys(patch).length > 0) {
            patch.updated_at = new Date().toISOString();
            await db
              .from('applications')
              .update(patch)
              .eq('id', doc.application_id);
            auto_applied = true;
          }

          // Mark document as applied
          await db
            .from('documents')
            .update({ applied_to_application: true, applied_at: new Date().toISOString() })
            .eq('id', document_id);
        }
      } catch { /* non-fatal — extraction result is still valid */ }
    }

    // Audit log
    try {
      await db.from('audit_logs').insert({
        action: 'document.extract',
        resource_type: 'document',
        resource_id: document_id,
        actor_id: auth.id ?? null,
        metadata: {
          method,
          field_count: Object.keys(fields).length,
          auto_applied,
          fields_applied,
          application_id: doc.application_id ?? null,
        },
      });
    } catch { /* non-fatal */ }

    return NextResponse.json({
      ok: true,
      extraction_method: method,
      field_count: Object.keys(fields).length,
      extracted_data,
      ocr_text: text || null,
      auto_applied,
      fields_applied,
    });
  } catch (err) {
    await db.from('documents').update({ extraction_status: 'failed' }).eq('id', document_id);
    return safeInternalError(err, 'Extraction failed');
  }
}
