
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOpenAIClient, isOpenAIConfigured } from '@/lib/openai-client';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
if (!isOpenAIConfigured()) {
    return NextResponse.json(
      { error: 'AI features not configured. Please set OPENAI_API_KEY.' },
      { status: 503 }
    );
  }

  const client = getOpenAIClient();
  if (!client) {
    return NextResponse.json(
      { error: 'AI service unavailable' },
      { status: 503 }
    );
  }

  const supabase = await createClient();
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

  if (!profile || !['admin', 'instructor'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: rawEnrollments } = await supabase
    .from('program_enrollments')
    .select('id, user_id, progress_percent, status, created_at, updated_at')
    .eq('status', 'in_progress')
    .limit(100);

  // Hydrate profiles separately (user_id → auth.users, no FK to profiles)
  const dropoutUserIds = [...new Set((rawEnrollments ?? []).map((e: any) => e.user_id).filter(Boolean))];
  const { data: dropoutProfiles } = dropoutUserIds.length
    ? await supabase.from('profiles').select('id, email, full_name').in('id', dropoutUserIds)
    : { data: [] };
  const dropoutProfileMap = Object.fromEntries((dropoutProfiles ?? []).map((p: any) => [p.id, p]));
  const enrollments = (rawEnrollments ?? []).map((e: any) => ({ ...e, profiles: dropoutProfileMap[e.user_id] ?? null }));

  if (!enrollments || enrollments.length === 0) {
    return NextResponse.json({ scores: [] });
  }

  const features = enrollments.map((e: Record<string, any>) => {
    const daysSinceStart = Math.floor(
      (Date.now() - new Date(e.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(e.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      id: e.id,
      progress: e.progress_percent || 0,
      daysSinceStart,
      daysSinceActivity,
      userEmail: e.profiles?.email || 'unknown',
    };
  });

  const prompt = `
You are helping an LMS predict dropout risk for students.

For each enrollment, return a risk score from 0-1 (higher = more likely to drop out).
Consider:
- Low progress after many days = higher risk
- Long time since last activity = higher risk
- Good progress with recent activity = lower risk

Input is JSON list. Respond with JSON array of objects with "id" and "risk" fields.

${JSON.stringify(features, null, 2)}
`;

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const text = completion.choices[0].message.content || '[]';
    let parsed: any;

    try {
      parsed = JSON.parse(text);
    } catch (error) {
      // Try to extract JSON from markdown code blocks
      const match = text.match(/```json\n([\s\S]*?)\n```/);
      if (match) {
        parsed = JSON.parse(match[1]);
      } else {
        parsed = [];
      }
    }

    return NextResponse.json({ scores: parsed });
  } catch (error) { 
    logger.error(
      'Dropout risk prediction error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to predict dropout risk' },
      { status: 500 }
    );
  }
}
export const GET = withRuntime(withApiAudit('/api/analytics/dropout-risk', _GET));
