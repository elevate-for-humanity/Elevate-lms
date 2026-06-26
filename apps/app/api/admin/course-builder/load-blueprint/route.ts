import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { getAllBlueprints } from '@/lib/curriculum/blueprints';
import { safeError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/course-builder/load-blueprint
 *
 * Returns all registered blueprints as a list for the Course Builder dropdown.
 *
 * GET ?id=crs-indiana  — returns a single blueprint converted to ProgramBuilderTemplate shape
 *                        so the Course Builder form can be pre-populated.
 */
export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  const registry = await getAllBlueprints();

  // List all blueprints
  if (!id) {
    return NextResponse.json({
      blueprints: registry.map((b) => ({
        id: b.id,
        title: b.credentialTitle,
        state: b.state,
        slug: b.programSlug,
        modules: b.modules.length,
        lessons: b.modules.reduce((s, m) => s + (m.lessons?.length ?? 0), 0),
        status: b.status,
      })),
    });
  }

  // Load a specific blueprint and convert to ProgramBuilderTemplate shape
  const blueprint = registry.find((b) => b.id === id);
  if (!blueprint) return safeError('Blueprint not found', 404);

  const template = {
    title: blueprint.credentialTitle,
    slug: blueprint.programSlug,
    credentialTarget: blueprint.credentialCode ?? 'INTERNAL',
    minimumHours: blueprint.generationRules?.maxTotalLessons ?? 40,
    requiresFinalExam: blueprint.generationRules?.requiresFinalExam ?? false,
    finalExam: { required: blueprint.generationRules?.requiresFinalExam ?? false },
    certificateRequirements: {
      includeHours: true,
      includeCompetencies: true,
      includeInstructorVerification: true,
      includeCompletionDate: true,
      includeVerificationUrl: true,
      requireAllCriticalCompetencies: false,
    },
    regulatory: {
      complianceProfileKey: 'internal_basic',
      credentialTarget: blueprint.credentialCode ?? 'INTERNAL',
      governingBody: null,
      governingRegion: blueprint.state ?? null,
      governingStandardVersion: null,
      retentionPolicyDays: null,
      auditNotes: null,
    },
    status: 'draft',
    modules: blueprint.modules.map((mod, mi) => ({
      slug: mod.slug,
      title: mod.title,
      orderIndex: mi,
      domainKey: mod.domainKey ?? '',
      targetHours: Math.ceil((mod.minLessons ?? 1) * 0.75),
      quizRequired: mod.quizRequired ?? false,
      practicalRequired: mod.practicalRequired ?? false,
      lessons: (mod.lessons ?? []).map((les, li) => ({
        slug: les.slug,
        title: les.title,
        orderIndex: li,
        lessonType: 'lesson' as const,
        durationMinutes: 45,
        learningObjectives: les.objective ? [les.objective] : [''],
        content: les.content ? { html: les.content } : {},
        quizQuestions: les.quizQuestions ?? [],
        competencyChecks: [],
        practicalRequired: false,
        requiredArtifacts: [],
        activities: ['video', 'reading', 'flashcards', 'practice'],
        isRequired: true,
        generationStatus: les.content ? 'ready' : 'draft',
        domainKey: les.domainKey ?? null,
        hourCategory: null,
        evidenceType: null,
        deliveryMethod: null,
        requiresInstructorSignoff: false,
        instructorRequirement: null,
        minimumSeatTimeMinutes: null,
        fieldworkEligible: false,
      })),
    })),
  };

  return NextResponse.json({
    template,
    blueprint: { id: blueprint.id, title: blueprint.credentialTitle },
  });
}
