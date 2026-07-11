/**
 * POST /api/course-builder/credential
 * 
 * Credential Intelligence Engine API
 * 
 * Request body:
 * {
 *   "action": "analyze" | "generate" | "validate",
 *   "userRequest": "Build EPA 608 course",
 *   "credentialSlug": "epa-608-universal",  // optional
 *   "courseType": "credential"  // optional, auto-detected
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import {
  buildGenerationContext,
  buildLessonPrompt,
  buildQuizPrompt,
  buildFlashcardPrompt,
  buildPracticeExamPrompt,
  getSupportedCredentials,
  searchForCredentials,
  getCredentialInfo,
} from '@/lib/course-builder/credential-engine';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'moderate');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json().catch(() => null);
    if (!body) return safeError('Invalid JSON body', 400);

    const { action, userRequest, credentialSlug, courseType } = body;

    if (!userRequest && action !== 'list' && action !== 'search') {
      return safeError('userRequest is required', 400);
    }

    switch (action) {
      case 'analyze': {
        const context = buildGenerationContext({
          userRequest,
          credentialSlug,
          courseType,
        });

        return NextResponse.json({
          ok: true,
          action: 'analyze',
          detected: {
            courseType: context.courseType,
            generationMode: context.generationMode,
            credential: context.credential ? {
              slug: context.credential.slug,
              name: context.credential.name,
              provider: context.credential.provider,
              examFormat: context.credential.examFormat,
              passingScore: context.credential.passingScore,
              totalQuestions: context.credential.totalQuestions,
              examSections: context.credential.examSections,
            } : null,
            blueprintLoaded: !!context.blueprint,
            ragTopics: context.ragContext.examTopics.length,
            criticalNumbers: Object.keys(context.ragContext.criticalNumbers).length,
          },
          promptPreview: {
            systemPrompt: context.systemPrompt.slice(0, 200) + '...',
            hasExamFocus: context.credential !== undefined,
            hasBlueprintContext: context.blueprintPrompt.length > 0,
          },
        });
      }

      case 'generate-prompt': {
        const { lessonTitle, examDomain, type } = body;
        
        const context = buildGenerationContext({
          userRequest,
          credentialSlug,
          courseType,
        });

        let prompt: string;
        switch (type) {
          case 'quiz':
            prompt = buildQuizPrompt(context, lessonTitle, examDomain);
            break;
          case 'flashcard':
            prompt = buildFlashcardPrompt(context, lessonTitle);
            break;
          case 'practice-exam':
            prompt = buildPracticeExamPrompt(context);
            break;
          default:
            prompt = buildLessonPrompt(context, lessonTitle, examDomain);
        }

        return NextResponse.json({
          ok: true,
          action: 'generate-prompt',
          prompt,
          context: {
            courseType: context.courseType,
            credential: context.credential?.name,
            blueprintLoaded: !!context.blueprint,
          },
        });
      }

      case 'list': {
        const credentials = getSupportedCredentials();
        return NextResponse.json({
          ok: true,
          action: 'list',
          credentials: credentials.map(c => ({
            slug: c.slug,
            name: c.name,
            provider: c.provider,
            category: c.category,
            examFormat: c.examFormat,
            passingScore: c.passingScore,
          })),
        });
      }

      case 'search': {
        const { query } = body;
        const results = searchForCredentials(query || userRequest);
        return NextResponse.json({
          ok: true,
          action: 'search',
          query: query || userRequest,
          results: results.map(c => ({
            slug: c.slug,
            name: c.name,
            provider: c.provider,
          })),
        });
      }

      case 'info': {
        const credential = getCredentialInfo(credentialSlug || userRequest);
        if (!credential) {
          return safeError('Credential not found', 404);
        }
        return NextResponse.json({
          ok: true,
          action: 'info',
          credential: {
            ...credential,
            examSections: credential.examSections.map(s => ({
              name: s.name,
              questions: s.questions,
              passingScore: s.passingScore,
              topicCount: s.topics.length,
            })),
          },
        });
      }

      default:
        return safeError(`Unknown action: ${action}`, 400);
    }
  } catch (err) {
    return safeInternalError(err, 'Credential engine error');
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'list') {
    const credentials = getSupportedCredentials();
    return NextResponse.json({
      ok: true,
      credentials: credentials.map(c => ({
        slug: c.slug,
        name: c.name,
        provider: c.provider,
        category: c.category,
      })),
    });
  }

  if (action === 'info') {
    const slug = searchParams.get('slug');
    if (!slug) return safeError('slug is required', 400);
    const credential = getCredentialInfo(slug);
    if (!credential) return safeError('Credential not found', 404);
    return NextResponse.json({ ok: true, credential });
  }

  return NextResponse.json({
    ok: true,
    message: 'Credential Intelligence Engine API',
    endpoints: {
      'POST /analyze': 'Detect course type and credential from user request',
      'POST /generate-prompt': 'Generate lesson/quiz/exam prompts',
      'GET /list': 'List all supported credentials',
      'POST /search': 'Search for credentials',
      'GET /info?slug=X': 'Get credential details',
    },
  });
}
