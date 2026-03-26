import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;
    const enrollmentId = formData.get('enrollmentId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${enrollmentId}/${documentType}-${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('enrollment-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      logger.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('enrollment-documents')
      .getPublicUrl(fileName);

    // Create document record in database
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        enrollment_id: enrollmentId || null,
        file_name: file.name,
        document_type: documentType,
        file_url: urlData.publicUrl,
        file_path: fileName,
        file_size: file.size,
        mime_type: file.type,
        status: 'pending_review',
      })
      .select()
      .single();

    if (dbError) {
      logger.error('Database error:', dbError);
      // Don't fail - file is uploaded, just log the error
    }

    return NextResponse.json({ 
      success: true, 
      document: document || { file_url: urlData.publicUrl },
      path: fileName,
    });
  } catch (error) {
    logger.error('Document upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/enrollment/upload-document', _POST);
