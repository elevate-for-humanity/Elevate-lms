export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or instructor
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!['admin', 'instructor'].includes(profile?.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const courseId = formData.get('course_id') as string;

    if (!file || !courseId) {
      return NextResponse.json(
        { error: 'Missing file or course_id' },
        { status: 400 }
      );
    }

    // Upload SCORM package to Supabase Storage
    const fileName = `scorm/${courseId}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('course-content')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Note: Parse SCORM manifest (imsmanifest.xml)
    // Note: Extract course structure and create lessons
    // For now, just store the reference

    const { data: scormData, error: scormError } = await supabase
      .from('scorm_packages')
      .insert({
        course_id: courseId,
        file_path: uploadData.path,
        uploaded_by: user.id,
        status: 'processing',
      })
      .select()
      .single();

    if (scormError) throw scormError;

    return NextResponse.json(
      {
        message: 'SCORM package uploaded successfully',
        package: scormData,
      },
      { status: 201 }
    );
  } catch (error) { /* Error handled silently */ 
    logger.error('Error uploading SCORM package:', error);
    return NextResponse.json(
      { error: 'Failed to upload SCORM package' },
      { status: 500 }
    );
  }
}
