import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { buildGenerationContext, buildLessonPrompt, buildQuizPrompt, buildFlashcardPrompt, buildPracticeExamPrompt, getSupportedCredentials, searchForCredentials, getCredentialInfo } from '@/lib/course-builder/credential-engine';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  try {
    const body = await request.json().catch(() => null);
    if (!body) return safeError('Invalid JSON body', 400);
    const { action, userRequest, credentialSlug, courseType } = body;
    if (!userRequest && action !== 'list' && action !== 'search') return safeError('userRequest is required', 400);

    if (action === 'analyze') {
      const context = buildGenerationContext({ userRequest, credentialSlug, courseType });
      return NextResponse.json({ ok: true, action, detected: { courseType: context.courseType, generationMode: context.generationMode, credential: context.credential ?? null, blueprintLoaded: !!context.blueprint, ragTopics: context.ragContext.examTopics.length, criticalNumbers: Object.keys(context.ragContext.criticalNumbers).length } });
    }
    if (action === 'generate-prompt') {
      const { lessonTitle, examDomain, type } = body;
      const context = buildGenerationContext({ userRequest, credentialSlug, courseType });
      const prompt = type === 'quiz' ? buildQuizPrompt(context, lessonTitle, examDomain) : type === 'flashcard' ? buildFlashcardPrompt(context, lessonTitle) : type === 'practice-exam' ? buildPracticeExamPrompt(context) : buildLessonPrompt(context, lessonTitle, examDomain);
      return NextResponse.json({ ok: true, action, prompt, context: { courseType: context.courseType, credential: context.credential?.name, blueprintLoaded: !!context.blueprint } });
    }
    if (action === 'list') return NextResponse.json({ ok: true, action, credentials: getSupportedCredentials() });
    if (action === 'search') return NextResponse.json({ ok: true, action, query: body.query || userRequest, results: searchForCredentials(body.query || userRequest) });
    if (action === 'info') {
      const credential = getCredentialInfo(credentialSlug || userRequest);
      if (!credential) return safeError('Credential not found', 404);
      return NextResponse.json({ ok: true, action, credential });
    }
    return safeError(`Unknown action: ${action}`, 400);
  } catch (err) {
    return safeInternalError(err, 'Credential engine error');
  }
}

export async function GET(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  const action = request.nextUrl.searchParams.get('action');
  if (action === 'list') return NextResponse.json({ ok: true, credentials: getSupportedCredentials() });
  if (action === 'info') {
    const slug = request.nextUrl.searchParams.get('slug');
    if (!slug) return safeError('slug is required', 400);
    const credential = getCredentialInfo(slug);
    if (!credential) return safeError('Credential not found', 404);
    return NextResponse.json({ ok: true, credential });
  }
  return NextResponse.json({ ok: true, message: 'Credential Intelligence Engine — Unified Course Builder' });
}
