import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { toErrorMessage } from '@/lib/safe';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a program holder
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'program_holder') {
      return NextResponse.json(
        { error: 'Must be a program holder to upload documents' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('document_type') as string;
    const description = formData.get('description') as string | null;

    if (!file || !documentType) {
      return NextResponse.json(
        { error: 'Missing required fields: file and document_type' },
        { status: 400 }
      );
    }

    // Validate document type
    const validTypes = [
      'syllabus',
      'license',
      'insurance',
      'accreditation',
      'instructor_credentials',
      'facility_photos',
      'mou',
      'other',
    ];

    if (!validTypes.includes(documentType)) {
      return NextResponse.json(
        {
          error: `Invalid document_type. Must be one of: ${validTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Get file extension
    const fileExt = file.name.split('.').pop();
    const fileName = file.name;

    // Upload to storage with organized path
    const path = `${user.id}/${documentType}/${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('program-holder-documents')
      .upload(path, file, {
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage
      .from('program-holder-documents')
      .getPublicUrl(uploadData.path);

    // Save document record to database
    const { data: document, error: dbError } = await supabase
      .from('program_holder_documents')
      .insert({
        user_id: user.id,
        organization_id: profile.organization_id,
        document_type: documentType,
        file_name: fileName,
        file_url: uploadData.path,
        file_size: file.size,
        mime_type: file.type,
        description: description || null,
        uploaded_by: user.id,
        approved: false,
      })
      .select()
      .single();

    if (dbError) {
      // Clean up uploaded file
      await supabase.storage
        .from('program-holder-documents')
        .remove([uploadData.path]);

      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        document_type: document.document_type,
        file_name: document.file_name,
        file_url: publicUrl,
        approved: document.approved,
        created_at: document.created_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { err: toErrorMessage(err) || 'Upload failed' },
      { status: 500 }
    );
  }
}
