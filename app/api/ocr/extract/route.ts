import { logger } from '@/lib/logger';
/**
 * Universal OCR Extraction API
 * Redirects to Netlify function to keep heavy dependencies out of main handler
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string || 'auto';
    const programContext = formData.get('programContext') as string || 'general';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Supported: JPEG, PNG, WebP' 
      }, { status: 400 });
    }

    // Convert file to base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Call Netlify function
    const response = await fetch(`${process.env.URL || ''}/.netlify/functions/ocr-extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: dataUrl,
        options: { language: 'eng', preprocess: true },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error: 'OCR extraction failed', details: error }, { status: 500 });
    }

    const result = await response.json();

    // Log extraction for audit
    await supabase.from('ocr_extractions').insert({
      user_id: user.id,
      document_type: documentType,
      program_context: programContext,
      file_name: file.name,
      file_type: file.type,
      success: true,
      extracted_at: new Date().toISOString(),
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      data: result,
      rawText: result.text?.substring(0, 500),
      documentType,
      programContext,
    });

  } catch (error) {
    logger.error('OCR extraction failed:', error);
    return NextResponse.json({
      success: false,
      error: 'OCR extraction failed',
      message: 'Internal server error',
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
return NextResponse.json({
    name: 'Universal OCR API',
    version: '2.0.0',
    description: 'Extract text from documents (powered by Netlify function)',
    supportedFormats: ['JPEG', 'PNG', 'WebP'],
    usage: 'POST with multipart/form-data: file, documentType, programContext',
  });
}
