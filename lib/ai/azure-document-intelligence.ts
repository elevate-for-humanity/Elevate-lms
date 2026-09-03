/**
 * lib/ai/azure-document-intelligence.ts
 *
 * Azure AI Document Intelligence (formerly Form Recognizer) integration.
 *
 * Replaces the current regex-based OCR extraction in the document extract route
 * with Azure's pre-built and custom models for structured field extraction.
 *
 * Required env vars:
 *   AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT  — https://your-resource.cognitiveservices.azure.com
 *   AZURE_DOCUMENT_INTELLIGENCE_KEY
 *
 * Models used:
 *   prebuilt-document   — general documents (grants, MOUs, contracts)
 *   prebuilt-idDocument — government IDs (driver's license, state ID)
 *   prebuilt-invoice    — invoices and receipts
 *   prebuilt-w2         — W-2 tax forms
 *   prebuilt-tax.us.w2  — W-2 (alias)
 *
 * API version: 2024-11-30 (GA)
 */

import { logger } from '@/lib/logger';

const API_VERSION = '2024-11-30';

export interface DocumentField {
  key: string;
  value: string | null;
  confidence: number;
  boundingRegions?: Array<{ pageNumber: number; polygon: number[] }>;
}

export interface DocumentIntelligenceResult {
  modelId: string;
  fields: DocumentField[];
  tables: DocumentTable[];
  pages: number;
  confidence: number;
  rawText: string;
  keyValuePairs: Array<{ key: string; value: string; confidence: number }>;
}

export interface DocumentTable {
  rowCount: number;
  columnCount: number;
  cells: Array<{ rowIndex: number; columnIndex: number; content: string }>;
}

function getEndpoint() { return (process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || '').replace(/\/$/, ''); }
function getKey() { return process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY || ''; }

export function isDocumentIntelligenceAvailable(): boolean {
  return !!(getEndpoint() && getKey());
}

/**
 * Select the best model for a given document type.
 */
function selectModel(documentType: string): string {
  const type = documentType.toLowerCase();
  if (type.includes('id') || type.includes('license') || type.includes('passport')) return 'prebuilt-idDocument';
  if (type.includes('invoice') || type.includes('receipt')) return 'prebuilt-invoice';
  if (type.includes('w2') || type.includes('w-2') || type.includes('tax')) return 'prebuilt-tax.us.w2';
  if (type.includes('w9') || type.includes('w-9')) return 'prebuilt-document';
  return 'prebuilt-document';
}

/**
 * Analyze a document using Azure Document Intelligence.
 *
 * @param fileUrl   — publicly accessible URL OR base64 data URI
 * @param documentType — hint for model selection (e.g. 'id', 'invoice', 'w2', 'contract')
 */
export async function analyzeDocument(
  fileUrl: string,
  documentType = 'general',
): Promise<DocumentIntelligenceResult> {
  const endpoint = getEndpoint();
  const key = getKey();

  if (!endpoint || !key) {
    throw new Error('Azure Document Intelligence not configured. Set AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT and AZURE_DOCUMENT_INTELLIGENCE_KEY.');
  }

  const modelId = selectModel(documentType);
  const analyzeUrl = `${endpoint}/documentintelligence/documentModels/${modelId}:analyze?api-version=${API_VERSION}`;

  // Submit analysis job
  const isBase64 = fileUrl.startsWith('data:');
  const submitBody = isBase64
    ? { base64Source: fileUrl.split(',')[1] }
    : { urlSource: fileUrl };

  const submitRes = await fetch(analyzeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Ocp-Apim-Subscription-Key': key },
    body: JSON.stringify(submitBody),
  });

  if (!submitRes.ok) {
    const text = await submitRes.text();
    throw new Error(`Document Intelligence submit failed ${submitRes.status}: ${text}`);
  }

  // Get operation URL from response header
  const operationUrl = submitRes.headers.get('Operation-Location');
  if (!operationUrl) throw new Error('Document Intelligence: no Operation-Location header');

  // Poll for result (max 30s)
  let result: any = null;
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await fetch(operationUrl, {
      headers: { 'Ocp-Apim-Subscription-Key': key },
    });
    const data = await pollRes.json();
    if (data.status === 'succeeded') { result = data; break; }
    if (data.status === 'failed') throw new Error(`Document Intelligence analysis failed: ${JSON.stringify(data.error)}`);
  }

  if (!result) throw new Error('Document Intelligence: analysis timed out after 30s');

  return parseResult(result, modelId);
}

function parseResult(raw: any, modelId: string): DocumentIntelligenceResult {
  const analyzeResult = raw.analyzeResult || {};
  const documents = analyzeResult.documents || [];
  const pages = analyzeResult.pages || [];
  const tables = analyzeResult.tables || [];

  // Extract fields from the first document
  const fields: DocumentField[] = [];
  if (documents[0]?.fields) {
    for (const [key, field] of Object.entries(documents[0].fields as Record<string, any>)) {
      fields.push({
        key,
        value: field.valueString ?? field.content ?? null,
        confidence: field.confidence ?? 0,
        boundingRegions: field.boundingRegions,
      });
    }
  }

  // Extract key-value pairs
  const keyValuePairs = (analyzeResult.keyValuePairs || []).map((kv: any) => ({
    key: kv.key?.content ?? '',
    value: kv.value?.content ?? '',
    confidence: kv.confidence ?? 0,
  }));

  // Extract raw text from all pages
  const rawText = pages
    .flatMap((p: any) => (p.lines || []).map((l: any) => l.content))
    .join('\n');

  // Parse tables
  const parsedTables: DocumentTable[] = tables.map((t: any) => ({
    rowCount: t.rowCount,
    columnCount: t.columnCount,
    cells: (t.cells || []).map((c: any) => ({
      rowIndex: c.rowIndex,
      columnIndex: c.columnIndex,
      content: c.content,
    })),
  }));

  // Overall confidence = average of field confidences
  const allConfidences = [...fields.map((f) => f.confidence), ...keyValuePairs.map((kv) => kv.confidence)];
  const avgConfidence = allConfidences.length
    ? allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length
    : 0;

  logger.info('[document-intelligence] Analysis complete', {
    modelId,
    fields: fields.length,
    kvPairs: keyValuePairs.length,
    pages: pages.length,
    confidence: avgConfidence.toFixed(2),
  });

  return {
    modelId,
    fields,
    tables: parsedTables,
    pages: pages.length,
    confidence: avgConfidence,
    rawText,
    keyValuePairs,
  };
}

/**
 * Convert Document Intelligence result to the flat field map
 * used by the existing document extract route.
 */
export function toExtractedFields(result: DocumentIntelligenceResult): Record<string, string> {
  const out: Record<string, string> = {};

  // Fields from structured model
  for (const f of result.fields) {
    if (f.value && f.confidence > 0.5) {
      out[f.key.toLowerCase().replace(/\s+/g, '_')] = f.value;
    }
  }

  // Key-value pairs from general document model
  for (const kv of result.keyValuePairs) {
    if (kv.key && kv.value && kv.confidence > 0.5) {
      const normalizedKey = kv.key.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      if (normalizedKey && !out[normalizedKey]) {
        out[normalizedKey] = kv.value;
      }
    }
  }

  return out;
}
