// POST /api/ai/job-match
// Matches a learner's skills against active job postings using AI.
// Called by app/ai/job-match/page.tsx

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { aiChat } from '@/lib/ai/ai-service';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { skills?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { skills } = body;
  if (!skills?.trim()) {
    return NextResponse.json({ error: 'skills is required' }, { status: 400 });
  }

  // Fetch active job postings to match against
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, description, required_skills, location, employer_name')
    .eq('status', 'active')
    .limit(30);

  const jobList = (jobs ?? [])
    .map((j: any) => `- ${j.title} at ${j.employer_name ?? 'Unknown'} (${j.location ?? 'Remote'}): ${j.required_skills ?? j.description ?? ''}`)
    .join('\n');

  const prompt = jobList
    ? `Learner skills: ${skills}\n\nActive job postings:\n${jobList}\n\nReturn a JSON array of the top 5 matches. Each item: { id, title, employer_name, match_score (0-100), reason }.`
    : `Learner skills: ${skills}\n\nNo active job postings found. Return an empty matches array with a helpful message.`;

  try {
    const result = await aiChat({
      messages: [{ role: 'user', content: prompt }],
      system: 'You are a career matching assistant. Return only valid JSON — no markdown, no explanation.',
      temperature: 0.3,
    });

    let matches: unknown[] = [];
    try {
      const parsed = JSON.parse(result.content);
      matches = Array.isArray(parsed) ? parsed : (parsed.matches ?? []);
    } catch {
      // AI returned non-JSON — return empty gracefully
      logger.warn('[job-match] AI response was not valid JSON', { content: result.content.slice(0, 200) });
    }

    return NextResponse.json({ matches });
  } catch (err) {
    logger.error('[job-match] aiChat failed', undefined, { err });
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 });
  }
}
