import {
  authenticatePartnerPortalGuidance,
  executePortalReadCommand,
} from '@/lib/paris/portal-read-tools';
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getErrorContext, normalizeError } from '@/lib/errors/normalize-error';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { VERIFIED_WORKFORCE_FUNDED_PROGRAMS } from '@/lib/programs/funding-registry';
import { refreshSecrets } from '@/lib/secrets';
import { aiChat } from '@/lib/ai/ai-service';

export const runtime = 'nodejs';
export const maxDuration = 60;

const verifiedFundingList = VERIFIED_WORKFORCE_FUNDED_PROGRAMS.map(
  (program) => `${program.title}: ${program.description}`,
).join('\n- ');

const PARIS_SYSTEM_PROMPT = `You are PARIS, the AI assistant for ${PLATFORM_DEFAULTS.orgName}.

PUBLIC-SURFACE RULES:
- This is public admissions and career navigation, not an authenticated learner workspace.
- Never promise that training is free, fully funded, guaranteed, or covered at a specific percentage.
- Never claim that a visitor qualifies for WIOA, Workforce Ready Grant, Job Ready Indy, or another funding source. Written authorization from the responsible agency controls funding.
- Never promise enrollment, employment, placement, wages, licensing, exam passage, or credential attainment.
- Direct visitors to the exact program record or application step instead of guessing.

VERIFIED PUBLIC WORKFORCE-FUNDING PROGRAM RECORDS:
- ${verifiedFundingList || 'No program-level public funding records are currently configured.'}

REGISTERED BEAUTY APPRENTICESHIP FACTS — 2Exclusive LLC-S, 2025-IN-132301:
- Barber 0030CB V1: competency-based; 14 Appendix A competencies; 260 RTI hours; 500-hour probation.
- Esthetician 2089CB V1: competency-based; 20 Appendix A competencies; 300 RTI hours; 500-hour probation.
- Nail Tech / Manicurist 2090CB V1: competency-based; 19 Appendix A competencies; 210 RTI hours; 500-hour probation.
- Hair Stylist / Cosmetologist 0096HY V1: hybrid; 2,000–2,500-hour registered term; 154 RTI hours; 500-hour probation.
- 500 hours is probation, not graduation. Do not replace registered apprenticeship requirements with traditional beauty-school hours.
- Indiana examination and licensing are separate from registered-program completion.

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

async function hasAuthenticatedPortalSession(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return Boolean(user);
}

const PORTAL_SYSTEM_PROMPT = `You are PARIS, the authenticated portal assistant for ${PLATFORM_DEFAULTS.orgName}.

REGISTERED BEAUTY APPRENTICESHIP FACTS — 2Exclusive LLC-S, 2025-IN-132301:
- Barber 0030CB V1: competency-based; 14 competencies + 260 RTI; 500-hour probation.
- Esthetician 2089CB V1: competency-based; 20 competencies + 300 RTI; 500-hour probation.
- Nail Tech / Manicurist 2090CB V1: competency-based; 19 competencies + 210 RTI; 500-hour probation.
- Hair Stylist / Cosmetologist 0096HY V1: hybrid; 2,000–2,500-hour term + 154 RTI; 500-hour probation.
- Never call 500 hours graduation. Never substitute traditional school-hour rules for the registered apprenticeship standard.

PORTAL OPERATING RULES:
- For applicant/student counts, pending-hour counts or a dashboard summary, the dedicated record tool answers before you are called. Never invent counts or claim to query records yourself.
- When asked to send, update, approve, enroll, sign or pay, clearly state that you have not performed the action. Draft requested text and link the correct dashboard form for review and submission.
- Help the signed-in user navigate their dashboard, understand required red to-dos, organize onboarding, draft notes and student outreach, and prepare progress updates.
- You may draft or prefill proposed text, checklists, and next steps. Clearly label drafts.
- Never claim you submitted, approved, signed, certified, paid, enrolled, messaged, or changed a record unless a dedicated tool confirms it.
- The human user must review and submit official hours, milestones, compliance records, agreements, certifications, payments, and outbound messages.
- Do not request or expose sensitive student data. Do not guess private information or claim access to dashboard records.
- Keep answers under 180 words and give one clear next step.`;

async function loadTrustedLearnerContext(): Promise<TrustedLearnerContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
    courseProgress:
      totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0,
    completedLessons,
    totalLessons,
  };
}

function getSmartFallback(
  userMessage: string,
  learnerContext?: TrustedLearnerContext | null,
): string {
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

  if (
    lower.includes('free') ||
    lower.includes('cost') ||
    lower.includes('pay') ||
    lower.includes('fund')
  ) {
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

async function _POST(req: NextRequest) {
  let learnerRequested = false;
  let portalRequested = false;
  try {
    await refreshSecrets().catch((error) => {
      logger.warn('[ai-chat] Secret refresh failed; checking runtime environment', error);
    });
    const body = await req.json().catch(() => null);

    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: 'Missing messages array' }, { status: 400 });
    }

    const messages = body.messages.slice(-20).map((item: any) => ({
      role: item.role === 'user' ? 'user' : 'assistant',
      content: String(item.content || '').slice(0, 2000),
    }));

    learnerRequested = body.context?.surface === 'learner';
    portalRequested = body.context?.surface === 'portal';
    const learnerContext = learnerRequested ? await loadTrustedLearnerContext() : null;
    if (learnerRequested && !learnerContext) {
      return NextResponse.json(
        { error: 'Authenticated learner course context is unavailable.' },
        { status: 403 },
      );
    }
    if (portalRequested) {
      const commandReply = await executePortalReadCommand(
        messages.at(-1)?.content || '',
        String(body.context?.page || ''),
      );
      if (commandReply)
        return NextResponse.json({ reply: commandReply, provider: 'portal-records' });
    }
    if (
      portalRequested &&
      !(await authenticatePartnerPortalGuidance(String(body.context?.page || ''))) &&
      !(await hasAuthenticatedPortalSession())
    ) {
      return NextResponse.json(
        { error: 'Authenticated portal session is unavailable.' },
        { status: 403 },
      );
    }
    const systemPrompt = learnerContext
      ? learnerSystemPrompt(learnerContext)
      : portalRequested
        ? PORTAL_SYSTEM_PROMPT
        : PARIS_SYSTEM_PROMPT;

    try {
      const result = await aiChat({
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        providerPolicy: 'owned-only',
        temperature: 0.25,
        maxTokens: 700,
        signal: AbortSignal.timeout(45_000),
      });
      if (!result.content.trim()) throw new Error('PARIS_EMPTY_REPLY');
      return NextResponse.json({ reply: result.content, provider: result.provider });
    } catch (error) {
      logger.error(
        'PARIS owned inference unavailable',
        normalizeError(error, 'PARIS inference failed'),
      );
      if (learnerRequested || portalRequested) {
        return NextResponse.json(
          {
            error:
              'PARIS language service is unavailable. No message was sent and no record was changed. You can still request assigned record counts or open dashboard pages.',
          },
          { status: 503 },
        );
      }
    }

    const userMessage = messages.slice(-1)?.[0]?.content || '';

    // Use smart fallback
    const fallbackReply = getSmartFallback(userMessage, learnerContext);

    return NextResponse.json({ reply: fallbackReply, provider: 'demo' });
  } catch (error) {
    logger.error(
      'Chat API error',
      normalizeError(error, 'Chat API failed'),
      getErrorContext(error),
    );
    if (learnerRequested || portalRequested) {
      return NextResponse.json(
        { error: 'PARIS guidance is temporarily unavailable. No task was completed.' },
        { status: 503 },
      );
    }
    const fallbackReply = `I'm having technical difficulties. Please call ${PLATFORM_DEFAULTS.supportPhone} or visit ${PLATFORM_DEFAULTS.canonicalDomain}/apply to get started!`;
    return NextResponse.json({ reply: fallbackReply, provider: 'demo' });
  }
}

export const POST = withRuntime(withApiAudit('/api/ai-chat', _POST));
