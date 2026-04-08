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

async function _POST(req: Request) {
    const rateLimited = await applyRateLimit(req, 'api');
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

  const { resumeText } = await req.json();

  if (!resumeText) {
    return NextResponse.json(
      { error: 'Resume text required' },
      { status: 400 }
    );
  }

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a career counselor for Elevate for Humanity, a workforce development platform.
Analyze resumes and match skills to:
1. Elevate training programs (healthcare, IT, manufacturing, hospitality)
2. WIOA-eligible occupations
3. Local job opportunities in Marion County, Indiana
4. Skills gaps and recommended training

Provide specific, actionable recommendations.`,
        },
        {
          role: 'user',
          content: `Analyze this resume and provide program recommendations:\n\n${resumeText}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const matches = completion.choices[0].message.content;

    // Log the job match for analytics
    await supabase.from('ai_job_matches').insert({
      user_id: user.id,
      resume_text: resumeText.slice(0, 1000), // Store first 1000 chars
      recommendations: matches,
    });

    return NextResponse.json({ matches });
  } catch (error) { 
    logger.error(
      'Job match error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to match jobs' },
      { status: 500 }
    );
  }
}
export const POST = withRuntime(withApiAudit('/api/ai/job-match', _POST));
