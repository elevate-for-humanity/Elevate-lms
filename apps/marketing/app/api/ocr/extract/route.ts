/**
 * Universal OCR Extraction API
 *
 * Used across the entire website for document reading:
 * - WIOA eligibility verification (pay stubs, ID, proof of residence)
 * - JRI applications (court documents, ID)
 * - Program enrollment (transcripts, certificates)
 * - Financial aid (tax returns, bank statements)
 * - Workforce board (employment verification)
 * - Apprenticeship (work logs, certifications)
 * - Healthcare programs (TB tests, immunization records)
 * - CDL training (driver's license, medical cards)
 * - Barber/Cosmetology (state licenses)
 */

import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const maxDuration = 120; // OCR can take time

// Dynamic import to avoid bundling tesseract.js into the main handler
async function getOCRFunctions() {
  const ocr = await import('@/lib/ocr/tesseract-ocr');
  const tax = await import('@/lib/tax-software/document-extraction');
  return {
    extractTextFromImage: ocr.extractTextFromImage,
    autoExtract: ocr.autoExtract,
    extractW2Data: tax.extractW2Data,
    extract1099Data: tax.extract1099Data,
    extractIDData: tax.extractIDData,
  };
}

// Document types supported
type DocumentType =
  | 'id'
  | 'drivers_license'
  | 'pay_stub'
  | 'w2'
  | '1099'
  | 'tax_return'
  | 'bank_statement'
  | 'court_document'
  | 'transcript'
  | 'certificate'
  | 'immunization_record'
  | 'tb_test'
  | 'medical_card'
  | 'work_log'
  | 'proof_of_residence'
  | 'auto';

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const documentType = (formData.get('documentType') as DocumentType) || 'auto';
    const programContext = (formData.get('programContext') as string) || 'general';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Invalid file type. Supported: JPEG, PNG, WebP, GIF, PDF',
        },
        { status: 400 },
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get OCR functions (dynamic import)
    const { autoExtract, extractW2Data, extract1099Data, extractIDData } =
      await getOCRFunctions();

    let result: any;

    // Extract text from PDFs and images using the same document-specific pipeline.
    // A PDF with no extractable text is reported as an error, not a successful import.
    const extracted = await autoExtract(buffer, file.type);
    const rawText = extracted.text;
    if (!rawText.trim()) {
      return NextResponse.json(
        { success: false, error: 'No readable text found in the document. Upload a clearer image or text-based PDF.' },
        { status: 422 },
      );
    }

    switch (documentType) {
      case 'w2':
      case '1099':
        // Structured extraction currently requires a rendered image.
        // Do not return a misleading successful W-2/1099 import for a PDF.
        if (file.type === 'application/pdf') {
          return NextResponse.json(
            { success: false, error: 'For structured W-2/1099 import, upload a JPEG, PNG, or WebP image of the document.' },
            { status: 422 },
          );
        }
        result = documentType === 'w2'
          ? await extractW2Data(buffer)
          : await extract1099Data(buffer);
        break;
      case 'id':
      case 'drivers_license':
        result = file.type === 'application/pdf' ? extracted : await extractIDData(buffer);
        break;
      default:
        result = extracted;
    }

    // Log extraction for audit
    await supabase
      .from('ocr_extractions')
      .insert({
        user_id: user.id,
        document_type: documentType,
        program_context: programContext,
        file_name: file.name,
        file_type: file.type,
        success: true,
        extracted_at: new Date().toISOString(),
      })
      .then(()=>{}, ()=>{}); // Don't fail if logging fails

    return NextResponse.json({
      success: true,
      data: result,
      rawText: rawText.substring(0, 500), // First 500 chars for preview
      documentType,
      programContext,
    });
  } catch (error) {
    logger.error('OCR extraction failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'OCR extraction failed',
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'Universal OCR API',
    version: '1.0.0',
    description: 'Extract text and data from documents across all programs',
    supportedTypes: [
      'id',
      'drivers_license',
      'pay_stub',
      'w2',
      '1099',
      'tax_return',
      'bank_statement',
      'court_document',
      'transcript',
      'certificate',
      'immunization_record',
      'tb_test',
      'medical_card',
      'work_log',
      'proof_of_residence',
      'auto',
    ],
    supportedFormats: ['JPEG', 'PNG', 'WebP', 'GIF', 'PDF'],
    usage: 'POST with multipart/form-data: file, documentType, programContext',
  });
}
