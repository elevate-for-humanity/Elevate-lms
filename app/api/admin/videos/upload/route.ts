import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createServerSupabaseClient } from '@/lib/auth';
import { withAuth } from '@/lib/with-auth';
import { toErrorMessage } from '@/lib/safe';

export const POST = withAuth(
  async (request: Request, user) => {

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const courseId = formData.get('courseId') as string;
    const lessonId = formData.get('lessonId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Upload to Supabase Storage
    const fileName = `${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('videos')
      .upload(fileName, file);

    if (uploadError) {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('videos').getPublicUrl(fileName);

    // Save video metadata to database
    const { data: videoData, error: dbError } = await supabase
      .from('videos')
      .insert({
        title,
        description,
        url: publicUrl,
        course_id: courseId ? parseInt(courseId, 10) : null,
        lesson_id: lessonId ? parseInt(lessonId, 10) : null,
        file_name: fileName,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: 'Database operation failed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      video: videoData,
    });
  } catch (error) { 
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }

  },
  { roles: ['admin', 'super_admin'] }
);
