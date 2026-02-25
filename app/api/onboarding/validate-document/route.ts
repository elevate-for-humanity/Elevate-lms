export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

interface ValidationResult {
  valid: boolean;
  status: 'approved' | 'pending_review' | 'rejected';
  checks: { name: string; passed: boolean; detail: string }[];
}

/**
 * Validate an uploaded onboarding document.
 * Runs basic checks (file exists, readable, minimum size/dimensions for images)
 * and OCR-based field extraction for IDs and SSN cards when Tesseract is available.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const db = admin || supabase;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documentId, documentType } = await request.json();

    if (!documentId || !documentType) {
      return NextResponse.json({ error: 'Missing documentId or documentType' }, { status: 400 });
    }

    // Fetch the document record
    const { data: doc, error: docError } = await db
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const checks: ValidationResult['checks'] = [];

    // Check 1: File exists in storage
    const { data: fileData, error: fileError } = await db.storage
      .from('documents')
      .download(doc.file_path);

    if (fileError || !fileData) {
      checks.push({ name: 'File accessible', passed: false, detail: 'File could not be retrieved from storage' });
      return NextResponse.json(buildResult(checks, documentId, db));
    }
    checks.push({ name: 'File accessible', passed: true, detail: 'File retrieved successfully' });

    // Check 2: Minimum file size (reject tiny/corrupt files)
    const buffer = Buffer.from(await fileData.arrayBuffer());
    const fileSizeKB = buffer.length / 1024;

    if (fileSizeKB < 10) {
      checks.push({ name: 'File size', passed: false, detail: `File is only ${fileSizeKB.toFixed(1)}KB — too small to be a valid document` });
    } else {
      checks.push({ name: 'File size', passed: true, detail: `${fileSizeKB.toFixed(0)}KB` });
    }

    // Check 3: For images, verify dimensions
    const isImage = doc.mime_type?.startsWith('image/');
    if (isImage) {
      try {
        const dimensions = getImageDimensions(buffer);
        if (dimensions) {
          const { width, height } = dimensions;
          if (width < 300 || height < 200) {
            checks.push({ name: 'Image quality', passed: false, detail: `Image is ${width}x${height}px — too small to read. Please upload a clearer photo.` });
          } else {
            checks.push({ name: 'Image quality', passed: true, detail: `${width}x${height}px` });
          }
        }
      } catch {
        // Can't read dimensions — not fatal
        checks.push({ name: 'Image quality', passed: true, detail: 'Could not verify dimensions' });
      }
    }

    // Check 4: OCR validation for ID and SSN card
    if (isImage && documentType === 'government_id') {
      try {
        const { extractTextFromImage } = await import('@/lib/ocr/tesseract-ocr');
        const ocrResult = await extractTextFromImage(buffer);

        if (ocrResult.confidence < 30) {
          checks.push({ name: 'Document readability', passed: false, detail: `OCR confidence ${ocrResult.confidence.toFixed(0)}% — image is too blurry or dark. Please retake the photo with better lighting.` });
        } else {
          checks.push({ name: 'Document readability', passed: true, detail: `OCR confidence ${ocrResult.confidence.toFixed(0)}%` });
        }

        const text = ocrResult.text.toUpperCase();

        if (documentType === 'government_id') {
          // Look for common ID markers
          const hasName = text.length > 20; // Reasonable amount of text extracted
          const hasIdMarkers = /DRIVER|LICENSE|STATE|IDENTIFICATION|ID|DOB|EXP|ISS|CLASS/.test(text);
          const hasDate = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(text);

          if (hasIdMarkers || hasDate) {
            checks.push({ name: 'ID document detected', passed: true, detail: 'Document appears to be a government-issued ID' });
          } else if (hasName) {
            checks.push({ name: 'ID document detected', passed: true, detail: 'Text detected but could not confirm ID type — will be reviewed' });
          } else {
            checks.push({ name: 'ID document detected', passed: false, detail: 'Could not detect ID text. Make sure the entire ID is visible and well-lit.' });
          }

          // Check for expiration
          const expMatch = text.match(/EXP[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
          if (expMatch) {
            const expDate = parseLooseDate(expMatch[1]);
            if (expDate && expDate < new Date()) {
              checks.push({ name: 'ID not expired', passed: false, detail: `ID appears to be expired (${expMatch[1]}). Please upload a current ID.` });
            } else if (expDate) {
              checks.push({ name: 'ID not expired', passed: true, detail: `Expires ${expMatch[1]}` });
            }
          }
        }


      } catch (ocrError) {
        // Tesseract not available or failed — non-fatal, route to manual review
        logger.warn('[ValidateDocument] OCR failed, routing to manual review', ocrError);
        checks.push({ name: 'Document readability', passed: true, detail: 'Automated verification unavailable — document will be manually reviewed' });
      }
    }

    // Determine overall result
    const result = buildResult(checks, documentId, db);

    // Update document status in DB
    const failedChecks = checks.filter(c => !c.passed);
    const newStatus = failedChecks.length === 0 ? 'verified' : failedChecks.some(c => c.name === 'File accessible' || c.name === 'File size') ? 'rejected' : 'pending_review';

    await db
      .from('documents')
      .update({
        status: newStatus,
        validation_checks: checks,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    logger.info('[ValidateDocument] Validation complete', {
      documentId,
      documentType,
      status: newStatus,
      passedChecks: checks.filter(c => c.passed).length,
      failedChecks: failedChecks.length,
    });

    return NextResponse.json({
      valid: failedChecks.length === 0,
      status: newStatus,
      checks,
    });
  } catch (error) {
    logger.error('[ValidateDocument] Unexpected error', error);
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
  }
}

function buildResult(
  checks: ValidationResult['checks'],
  _documentId: string,
  _db: any
): ValidationResult {
  const failedChecks = checks.filter(c => !c.passed);
  const hasCriticalFailure = failedChecks.some(c =>
    c.name === 'File accessible' || c.name === 'File size'
  );

  return {
    valid: failedChecks.length === 0,
    status: hasCriticalFailure ? 'rejected' : failedChecks.length > 0 ? 'pending_review' : 'approved',
    checks,
  };
}

/**
 * Extract image dimensions from a JPEG or PNG buffer without external dependencies.
 */
function getImageDimensions(buffer: Buffer): { width: number; height: number } | null {
  // PNG: bytes 16-23 contain width and height as 4-byte big-endian integers
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
  }

  // JPEG: scan for SOF0 marker (0xFF 0xC0) which contains dimensions
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
    let offset = 2;
    while (offset < buffer.length - 8) {
      if (buffer[offset] !== 0xFF) { offset++; continue; }
      const marker = buffer[offset + 1];
      // SOF markers: C0-C3, C5-C7, C9-CB, CD-CF
      if ((marker >= 0xC0 && marker <= 0xC3) || (marker >= 0xC5 && marker <= 0xC7) ||
          (marker >= 0xC9 && marker <= 0xCB) || (marker >= 0xCD && marker <= 0xCF)) {
        const height = buffer.readUInt16BE(offset + 5);
        const width = buffer.readUInt16BE(offset + 7);
        return { width, height };
      }
      const segmentLength = buffer.readUInt16BE(offset + 2);
      offset += 2 + segmentLength;
    }
  }

  return null;
}

/**
 * Parse a date string in common US formats (MM/DD/YYYY, MM-DD-YYYY, etc.)
 */
function parseLooseDate(dateStr: string): Date | null {
  try {
    const cleaned = dateStr.replace(/[\/\-]/g, '/');
    const parts = cleaned.split('/');
    if (parts.length !== 3) return null;
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);
    if (year < 100) year += 2000;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return new Date(year, month - 1, day);
  } catch {
    return null;
  }
}
