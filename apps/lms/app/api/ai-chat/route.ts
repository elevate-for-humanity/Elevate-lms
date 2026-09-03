import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getErrorContext, normalizeError } from '@/lib/errors/normalize-error';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { VERIFIED_WORKFORCE_FUNDED_PROGRAMS } from '@/lib/programs/funding-registry';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const verifiedFundingList = VERIFIED_WORKFORCE_FUNDED_PROGRAMS
  .map((program) => `${program.title}: ${program.description}`)
  .join('\n- ');

const PARIS_SYSTEM_PROMPT = `You are PARIS, the AI assistant for ${PLATFORM_DEFAULTS.orgName}.

PUBLIC-SURFACE RULES:
- This is public admissions and career navigation, not an authenticated learner workspace.
- Never promise that training is free, fully funded, guaranteed, or covered at a specific percentage.
- Never claim that a visitor qualifies for WIOA, Workforce Ready Grant, Job Ready Indy, or another funding source. Written authorization from the responsible agency controls funding.
- Never promise enrollment, employment, placement, wages, licensing, exam passage, or credential attainment.
- Direct visitors to the exact program record or application step instead of guessing.

VERIFIED PUBLIC WORKFORCE-FUNDING PROGRAM RECORDS:
- ${verifiedFundingList || 'No program-level public funding records are currently configured.'}

CONTACT:
- Phone: ${PLATFORM_DEFAULTS.supportPhone}
- Website: https://${PLATFORM_DEFAULTS.canonicalDomain}

RESPONSE STYLE:
- Answer directly, distinguish verified facts from eligibility screening, stay under 180 words, and provide one official next step.`;

type TrustedLearnerContext = {
  courseId: string;
  courseTitle: string;
  nextLessonTitle: string | null;
  courseProgress: number;
  completedLessons: number;
  totalLessons: number;
};

function learnerSystemPrompt(context: TrustedLearnerContext) {
  return `You are PARIS, the authenticated learning assistant for ${PLATFORM_DEFAULTS.orgName}.

TRUSTED LEARNER DASHBOARD CONTEXT:
- Current course: ${context.courseTitle}
- Completed lessons: ${context.completedLessons} of ${context.totalLessons}
- Dashboard progress: ${context.courseProgress}%
- Next lesson: ${context.nextLessonTitle || 'No incomplete published lesson is currently available'}

SCOPE AND LEARNER-SAFETY RULES:
- Help the learner understand concepts in the current course, study effectively, navigate the learner portal, and prepare for the next lesson.
- Correlate guidance to the trusted course and progress above. Do not claim access to any other private student information.
- Never complete a graded assignment, quiz, checkpoint, practical artifact, or exam for the learner. Do not provide answer keys or impersonate the learner.
- You may explain concepts, ask guiding questions, create ungraded practice examples, and suggest a study plan.
- Never mark a lesson complete, change progress, certify mastery, or claim that an instructor approved work.
- If the learner asks about an account, grade, payment, accommodation, or enrollment decision, direct them to the appropriate dashboard record or a human staff member rather than guessing.
- Keep answers under 180 words and give one clear next step.`;
}

async function loadTrustedLearnerContext(): Promise<TrustedLearnerContext | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: enrollment } = await supabase
    .from('course_enrollments')
    .select('course_id,status,created_at')
    .eq('student_id', user.id)
    .in('status', ['active', 'enrolled', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!enrollment?.course_id) return null;

  const [{ data: course }, { data: lessons }, { data: progress }] = await Promise.all([
    supabase.from('courses').select('id,title').eq('id', enrollment.course_id).maybeSingle(),
    supabase
      .from('course_lessons')
      .select('id,title,order_index')
      .eq('course_id', enrollment.course_id)
      .eq('is_published', true)
      .order('order_index', { ascending: true }),
    supabase
      .from('lesson_progress')
      .select('lesson_id,completed')
      .eq('user_id', user.id)
      .eq('course_id', enrollment.course_id),
  ]);
  if (!course) return null;

  const completed = new Set(
    (progress ?? [])
      .filter((row) => row.completed === true && row.lesson_id)
      .map((row) => String(row.lesson_id)),
  );
  const lessonList = lessons ?? [];
  const nextLesson = lessonList.find((lesson) => !completed.has(String(lesson.id))) ?? null;
  const completedLessons = lessonList.filter((lesson) => completed.has(String(lesson.id))).length;
  const totalLessons = lessonList.length;

  return {
    courseId: String(course.id),
    courseTitle: String(course.title || 'Current course'),
    nextLessonTitle: nextLesson?.title ? String(nextLesson.title) : null,
    courseProgress: totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0,
    completedLessons,
    totalLessons,
  };
}

function getSmartFallback(userMessage: string, learnerContext?: TrustedLearnerContext | null): string {
  if (learnerContext) {
    if (learnerContext.nextLessonTitle) {
      return `Your current course is **${learnerContext.courseTitle}**. You have completed ${learnerContext.completedLessons} of ${learnerContext.totalLessons} published lessons (${learnerContext.courseProgress}%). Your next lesson is **${learnerContext.nextLessonTitle}**. Open it from your learner dashboard. I can help you study the concepts, but I cannot complete graded work for you.`;
    }
    return `Your current course is **${learnerContext.courseTitle}**. No incomplete published lesson is available right now. Check the course record on your learner dashboard or contact your instructor; I will not guess about unpublished content or mark progress for you.`;
  }

  const lower = userMessage.toLowerCase();

  if (lower.includes('program') || lower.includes('course') || lower.includes('training')) {
    return `Elevate publishes career-training pathways across healthcare, skilled trades, beauty and personal services, technology, and business. Requirements, tuition, duration, credentials, and funding status differ by program. Review the exact record at https://${PLATFORM_DEFAULTS.canonicalDomain}/programs.`;
  }

  if (lower.includes('apply') || lower.includes('start') || lower.includes('enroll')) {
    return `Start at https://${PLATFORM_DEFAULTS.canonicalDomain}/apply and choose the exact program and payment or funding pathway you want reviewed. An application is not an enrollment or funding guarantee. For help, call ${PLATFORM_DEFAULTS.supportPhone}.`;
  }

  if (lower.includes('free') || lower.includes('cost') || lower.includes('pay') || lower.includes('fund')) {
    const titles = VERIFIED_WORKFORCE_FUNDED_PROGRAMS.map((program) => program.title).join(', ');
    return `Funding is program- and participant-specific and is not guaranteed by the website or application. Elevate's current public funding registry contains: ${titles || 'no published program-level funding records'}. Review https://${PLATFORM_DEFAULTS.canonicalDomain}/funding, then submit the exact program through https://${PLATFORM_DEFAULTS.canonicalDomain}/apply.`;
  }

  if (lower.includes('contact') || lower.includes('call') || lower.includes('human')) {
    return `You can reach us at:

📞 ${PLATFORM_DEFAULTS.supportPhone}
📧 info@${PLATFORM_DEFAULTS.canonicalDomain}
🌐 ${PLATFORM_DEFAULTS.canonicalDomain}

Ask about the exact program so staff can verify the correct requirements.`;
  }

  return `I can help you find the correct program, application, funding guidance, or apprenticeship information. I will not guess about eligibility, funding awards, placement, wages, licensing, or program approvals. Start at https://${PLATFORM_DEFAULTS.canonicalDomain}/programs, or tell me the exact program you are asking about.`;
}

async function callAnthropic(messages: any[], systemPrompt: string): Promise<{ reply: string; provider: string } | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.filter(m => m.role !== 'system'),
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return { reply: data.content?.[0]?.text || '', provider: 'anthropic' };
  } catch (e) {
    logger.warn('[ai-chat] Anthropic call failed', e);
    return null;
  }
}

async function callOpenAI(messages: any[], systemPrompt: string): Promise<{ reply: string; provider: string } | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return { reply: data.choices?.[0]?.message?.content || '', provider: 'openai' };
  } catch (e) {
    logger.warn('[ai-chat] OpenAI call failed', e);
    return null;
  }
}

async function _POST(req: NextRequest) {
  let learnerRequested = false;
  try {
    const body = await req.json().catch(() => null);

    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: 'Missing messages array' }, { status: 400 });
    }

    const messages = body.messages.slice(-20).map((item: any) => ({
      role: item.role === 'user' ? 'user' : 'assistant',
      content: String(item.content || '').slice(0, 2000),
    }));

    learnerRequested = body.context?.surface === 'learner';
    const learnerContext = learnerRequested ? await loadTrustedLearnerContext() : null;
    if (learnerRequested && !learnerContext) {
      return NextResponse.json(
        { error: 'Authenticated learner course context is unavailable.' },
        { status: 403 },
      );
    }
    const systemPrompt = learnerContext ? learnerSystemPrompt(learnerContext) : PARIS_SYSTEM_PROMPT;

    // Try PARIS AI (Anthropic) first
    const anthropicResult = await callAnthropic(messages, systemPrompt);
    if (anthropicResult) {
      return NextResponse.json({ reply: anthropicResult.reply, provider: anthropicResult.provider });
    }

    // Fall back to OpenAI
    const openaiResult = await callOpenAI(messages, systemPrompt);
    if (openaiResult) {
      return NextResponse.json({ reply: openaiResult.reply, provider: openaiResult.provider });
    }

    // Use smart fallback
    const userMessage = messages.slice(-1)?.[0]?.content || '';
    const fallbackReply = getSmartFallback(userMessage, learnerContext);

    return NextResponse.json({ reply: fallbackReply, provider: 'demo' });
  } catch (error) {
    logger.error('Chat API error', normalizeError(error, 'Chat API failed'), getErrorContext(error));
    if (learnerRequested) {
      return NextResponse.json({ error: 'Learner guidance is temporarily unavailable.' }, { status: 503 });
    }
    const fallbackReply = `I'm having technical difficulties. Please call ${PLATFORM_DEFAULTS.supportPhone} or visit ${PLATFORM_DEFAULTS.canonicalDomain}/apply to get started!`;
    return NextResponse.json({ reply: fallbackReply, provider: 'demo' });
  }
}

export const POST = withRuntime(withApiAudit('/api/ai-chat', _POST));
