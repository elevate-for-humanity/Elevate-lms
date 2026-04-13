import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';

async function _GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const { courseId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch modules' }, { status: 500 });
    }

    return NextResponse.json({ modules: data || [] });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function _POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const { courseId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, content, order_index } = body;

    const { data, error } = await supabase
      .from('course_modules')
      .insert({
        course_id: courseId,
        title,
        description,
        content,
        order_index,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create module' }, { status: 500 });
    }

    return NextResponse.json({ module: data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function _PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const { courseId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { modules } = body;

    // Update module order
    for (const mod of modules) {
      await supabase
        .from('course_modules')
        .update({ order_index: mod.order_index })
        .eq('id', mod.id)
        .eq('course_id', courseId);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/courses/[courseId]/modules', _GET);
export const POST = withApiAudit('/api/courses/[courseId]/modules', _POST);
export const PUT = withApiAudit('/api/courses/[courseId]/modules', _PUT);
