/**
 * Canonical LMS learner interaction endpoint.
 * Reads authored lesson experiences from course_lessons.content_json first.
 * Falls back to blueprint interaction specifications when a lesson has not yet
 * been enriched in the Unified Course Builder.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/requireAuth';
import { getClient } from '@/lib/supabase/client';
import { loadBlueprintWithProgram } from '@/lib/course-factory/blueprint-loader';
import type { BlueprintModule } from '@/lib/curriculum/blueprints/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { user, error: authError } = await requireAuth(request);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const lessonSlug = request.nextUrl.searchParams.get('lessonSlug');
  if (!lessonSlug) return NextResponse.json({ error: 'lessonSlug required' }, { status: 400 });

  try {
    const db = getClient();
    const { data: lesson, error: lessonError } = await db
      .from('course_lessons')
      .select('id,slug,title,course_id,module_id,content_json')
      .eq('slug', lessonSlug)
      .maybeSingle();
    if (lessonError) throw lessonError;
    if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });

    const contentJson = lesson.content_json && typeof lesson.content_json === 'object' ? lesson.content_json as Record<string, any> : {};
    const authored = contentJson.experience && typeof contentJson.experience === 'object' ? contentJson.experience as Record<string, any> : null;

    const { data: progress } = await db.from('interaction_progress').select('*').eq('learner_id', user.id).eq('lesson_slug', lessonSlug);
    const progressRows = progress ?? [];

    if (authored && Object.keys(authored).length > 0) {
      const interactions = experienceToInteractions(lessonSlug, authored, progressRows);
      return NextResponse.json({
        success: true,
        source: 'lesson-experience',
        lessonSlug,
        interactions,
        flashcards: Array.isArray(authored.flashcards) ? authored.flashcards : [],
        narrationScript: authored.narrationScript ?? null,
        visualPrompt: authored.visualPrompt ?? null,
        practicalTask: authored.practicalTask ?? null,
        interactiveVideo: authored.interactiveVideo ?? null,
        meta: { totalInteractions: interactions.length, completedInteractions: interactions.filter((i) => i.completed).length },
      });
    }

    // Compatibility fallback for older courses that only have blueprint specs.
    const { data: course } = await db.from('courses').select('program_id').eq('id', lesson.course_id).maybeSingle();
    const loaded = course?.program_id ? await loadBlueprintWithProgram(db as any, { programId: course.program_id }) : null;
    const blueprint = loaded?.blueprint;
    if (!blueprint) return NextResponse.json({ success: true, source: 'none', lessonSlug, interactions: [], flashcards: [] });

    let module: BlueprintModule | undefined;
    for (const candidate of blueprint.modules ?? []) {
      if (candidate.lessons?.some((l) => l.slug === lessonSlug)) { module = candidate; break; }
    }
    if (!module) return NextResponse.json({ success: true, source: 'none', lessonSlug, interactions: [], flashcards: [] });
    const interactions = blueprintInteractions(lessonSlug, module, progressRows);
    return NextResponse.json({ success: true, source: 'blueprint', lessonSlug, moduleSlug: module.slug, interactions, flashcards: [], meta: { specs: module.interactionSpecs, totalInteractions: interactions.length, completedInteractions: interactions.filter((i) => i.completed).length } });
  } catch (error) {
    console.error('[learner/interactions]', error);
    return NextResponse.json({ error: 'Failed to load interactions' }, { status: 500 });
  }
}

type Interaction = { id: string; type: string; title: string; position: string; completed: boolean; score?: number; attempts: number; data: Record<string, unknown> };

function stateFor(id: string, rows: Array<Record<string, any>>) {
  const row = rows.find((item) => item.interaction_id === id || item.interaction_type === id);
  return { completed: !!row?.completed, score: row?.score as number | undefined, attempts: Number(row?.attempts ?? 0) };
}

function experienceToInteractions(slug: string, e: Record<string, any>, rows: Array<Record<string, any>>): Interaction[] {
  const out: Interaction[] = [];
  const add = (suffix: string, type: string, title: string, data: any, position = 'inline') => {
    if (data === undefined || data === null || (Array.isArray(data) && data.length === 0)) return;
    const id = `${slug}-${suffix}`;
    out.push({ id, type, title, position, ...stateFor(id, rows), data: typeof data === 'object' ? data : { value: data } });
  };
  add('kc', 'knowledge-check', 'Knowledge Check', e.knowledgeChecks);
  add('scenario', 'scenario', e.scenario?.title ?? 'Workplace Scenario', e.scenario, 'checkpoint');
  add('hotspots', 'click-to-reveal', 'Interactive Diagram', e.hotspots);
  add('drag-drop', 'drag-drop', 'Drag and Drop', e.dragDrop);
  add('matching', 'matching', 'Matching Activity', e.matching);
  add('case', 'case-study', e.caseStudy?.title ?? 'Case Study', e.caseStudy, 'checkpoint');
  add('simulation', 'simulation', e.simulation?.title ?? 'Simulation', e.simulation, 'end');
  add('decision-tree', 'decision-tree', e.decisionTree?.title ?? 'Decision Practice', e.decisionTree, 'checkpoint');
  add('practical', 'practical', e.practicalTask?.title ?? 'Hands-on Practical', e.practicalTask, 'end');
  add('interactive-video', 'interactive-video', e.interactiveVideo?.title ?? 'Interactive Video', e.interactiveVideo);
  return out;
}

function blueprintInteractions(slug: string, module: BlueprintModule, rows: Array<Record<string, any>>): Interaction[] {
  const specs: any = module.interactionSpecs;
  if (!specs) return [];
  const out: Interaction[] = [];
  const add = (suffix: string, type: string, title: string, data: any, position = 'inline') => {
    const id = `${slug}-${suffix}`;
    out.push({ id, type, title, position, ...stateFor(id, rows), data });
  };
  if (specs.includeKnowledgeChecks) add('kc-1', 'knowledge-check', 'Knowledge Check', { questionCount: specs.knowledgeCheckCount ?? 1 });
  if (specs.includeScenarios) add('scenario-1', 'scenario', 'Scenario', { competencyKeys: module.competencies?.map((c: any) => c.competencyKey) ?? [] }, 'checkpoint');
  if (specs.includeClickToReveal) add('ctr', 'click-to-reveal', 'Interactive Diagram', { hotspotsRequired: 3 });
  if (specs.includeDragDrop) add('dd', 'drag-drop', 'Drag and Drop', { itemCount: specs.matchingCount ?? 4 });
  if (specs.includeMatching) add('match-1', 'matching', 'Matching Activity', { itemCount: specs.matchingCount ?? 6 });
  if (specs.includeCaseStudies) add('case', 'case-study', 'Case Study', { questionCount: specs.caseStudyCount ?? 5 }, 'checkpoint');
  if (specs.includeSimulations) add('sim', 'simulation', 'Virtual Lab', { category: module.domainKey }, 'end');
  if (specs.includeDecisionTrees) add('dt', 'decision-tree', 'Decision Practice', {}, 'checkpoint');
  return out;
}
