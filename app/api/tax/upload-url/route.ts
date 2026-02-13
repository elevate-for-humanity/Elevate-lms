
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { filename, contentType, contactInfo } = body;

    // Validate required fields
    if (!filename || !contentType) {
      return NextResponse.json(
        { error: 'filename and contentType required' },
        { status: 400 }
      );
    }

    // Validate contact info
    if (!contactInfo?.name || !contactInfo?.email || !contactInfo?.phone) {
      return NextResponse.json(
        { error: 'Contact information required (name, email, phone)' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create unique path with timestamp and sanitized filename
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `supersonicfastcash/${contactInfo.email}/${timestamp}-${sanitizedFilename}`;

    // Generate signed upload URL (valid for 1 hour)
    const { data, error }: any = await supabase.storage
      .from('tax-documents')
      .createSignedUploadUrl(path);

    if (error) {

      // If bucket doesn't exist, return helpful error
      if (error instanceof Error ? error.message : String(error).includes('not found')) {
        return NextResponse.json(
          {
            error: 'Storage bucket not configured. Please contact support.',
            details:
              'The tax-documents bucket needs to be created in Supabase.',
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to generate upload URL', details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }

    // Log upload for tracking (optional - store in database)
    try {
      await supabase.from('tax_document_uploads').insert([
        {
          name: contactInfo.name,
          email: contactInfo.email,
          phone: contactInfo.phone,
          filename: sanitizedFilename,
          file_path: path,
          uploaded_at: new Date().toISOString(),
        },
      ]);
    } catch (logError) {
      // Don't fail upload if logging fails
    }

    return NextResponse.json({
      path,
      token: data.token,
      signedUrl: data.signedUrl,
      expiresIn: 3600, // 1 hour
    });
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
