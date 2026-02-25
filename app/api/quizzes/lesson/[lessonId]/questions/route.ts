import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;
    const supabase = await createClient();
    const _admin = createAdminClient(); const db = _admin || supabase;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { data: questions, error } = await db
      .from('quiz_questions')
      .select('id, question, options, order_index')
      .eq('lesson_id', lessonId)
      .order('order_index');

    if (error) {
      return NextResponse.json({ questions: [] });
    }

    return NextResponse.json({ questions: questions || [] });
  } catch {
    return NextResponse.json({ questions: [] });
  }
}
