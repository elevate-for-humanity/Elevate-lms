import { NextResponse } from 'next/server';
import { QuestionCreateSchema } from '@/lib/validators/course';
import { createQuestion, listQuestions } from '@/lib/db/courses';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const supabase = await createClient();
  if (!supabase) return { error: 'Database unavailable', status: 500 };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin', 'instructor'].includes(profile.role)) {
    return { error: 'Forbidden', status: 403 };
  }
  return { user, profile };
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get('quiz_id');
    if (!quizId) return NextResponse.json({ error: 'quiz_id required' }, { status: 400 });
    const data = await listQuestions(quizId);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const body = await request.json().catch(() => null);
    const parsed = QuestionCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }
    const data = await createQuestion(parsed.data);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
