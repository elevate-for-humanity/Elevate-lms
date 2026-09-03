import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { runAITask } from '@/lib/ai/orchestrator';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type JobCandidate = {
  id: string;
  title: string;
  description: string | null;
  required_skills: string | null;
  location: string | null;
  employer_name: string | null;
};

type RankedMatch = {
  id: string;
  match_score: number;
  reason: string;
};

function parseAndValidateMatches(raw: string, jobs: JobCandidate[]) {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const parsed = JSON.parse(cleaned);
  const values: unknown[] = Array.isArray(parsed) ? parsed : parsed?.matches;
  if (!Array.isArray(values)) throw new Error('AI response does not contain a matches array');

  const candidates = new Map(jobs.map((job) => [String(job.id), job]));
  const seen = new Set<string>();

  return values.flatMap((value): Array<JobCandidate & RankedMatch> => {
    if (!value || typeof value !== 'object') return [];
    const item = value as Partial<RankedMatch>;
    const id = typeof item.id === 'string' ? item.id : '';
    const job = candidates.get(id);
    if (!job || seen.has(id)) return [];

    const score = Number(item.match_score);
    if (!Number.isFinite(score)) return [];
    seen.add(id);

    return [{
      ...job,
      match_score: Math.max(0, Math.min(100, Math.round(score))),
      reason:
        typeof item.reason === 'string' && item.reason.trim()
          ? item.reason.trim().slice(0, 500)
          : 'Matched from verified posting requirements.',
    }];
  }).slice(0, 5);
}

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const skills = typeof body?.skills === 'string' ? body.skills.trim() : '';
  if (!skills) return NextResponse.json({ error: 'skills is required' }, { status: 400 });

  const { data, error: jobsError } = await supabase
    .from('jobs')
    .select('id, title, description, required_skills, location, employer_name')
    .eq('status', 'active')
    .limit(30);

  if (jobsError) {
    logger.error('[job-match] active job query failed', undefined, { error: jobsError.message });
    return NextResponse.json({ error: 'Unable to load active jobs' }, { status: 503 });
  }

  const jobs = (data ?? []) as JobCandidate[];
  if (jobs.length === 0) return NextResponse.json({ matches: [], candidateCount: 0 });

  const candidatePayload = jobs.map((job) => ({
    id: String(job.id),
    title: job.title,
    employer_name: job.employer_name,
    location: job.location,
    required_skills: job.required_skills,
    description: job.description?.slice(0, 1200) ?? null,
  }));

  try {
    const result = await runAITask({
      task: 'career_counseling',
      prompt: `Rank only the supplied active job candidates against the learner's stated skills.\n\nLearner skills:\n${skills.slice(0, 4000)}\n\nCandidates:\n${JSON.stringify(candidatePayload)}\n\nReturn a JSON array of at most five objects with exactly: {"id":"an exact supplied candidate id","match_score":0,"reason":"evidence-based explanation"}. Never create or modify an id.`,
      context: { userId: user.id, skipRAG: true },
      temperature: 0.2,
      maxTokens: 1600,
    });

    const matches = parseAndValidateMatches(result.content, jobs);
    return NextResponse.json({
      matches,
      candidateCount: jobs.length,
      provider: result.provider,
      idValidation: 'passed',
    });
  } catch (err) {
    logger.error('[job-match] ranking failed', undefined, { err });
    return NextResponse.json({ error: 'AI job ranking unavailable' }, { status: 503 });
  }
}
