import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/authGuards';

export const dynamic = 'force-dynamic';

// PATCH - Update module (script, video_url, etc.)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await apiRequireAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;
    const { id } = await params;
    const body = await req.json();

    const supabase = createAdminClient();

    const updateData: any = {};
    
    if (body.script !== undefined) updateData.script = body.script;
    if (body.video_url !== undefined) updateData.video_url = body.video_url;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.duration_minutes !== undefined) updateData.duration_minutes = body.duration_minutes;
    if (body.is_preview !== undefined) updateData.is_preview = body.is_preview;

    const { data, error } = await supabase
      .from('career_course_modules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ module: data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update module' }, { status: 500 });
  }
}
