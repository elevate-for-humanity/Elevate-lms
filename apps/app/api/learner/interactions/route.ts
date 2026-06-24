/**
 * GET /api/learner/interactions?lessonSlug=xxx
 * 
 * Returns all interactions for a lesson, built from blueprint definitions.
 * Supports: knowledge-checks, flashcards, scenarios, click-to-reveal, drag-drop, etc.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/requireAuth';
import { getClient } from '@/lib/supabase/client';
import { loadBlueprintWithProgram } from '@/lib/course-factory/blueprint-loader';
import { getRequiredInteractions } from '@/lib/course-factory/integration/types';
import type { BlueprintModule } from '@/lib/curriculum/blueprints/types';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest
) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = request.nextUrl;
    const lessonSlug = searchParams.get('lessonSlug');
    const programSlug = searchParams.get('programSlug');
    
    if (!lessonSlug) {
      return NextResponse.json({ error: 'lessonSlug required' }, { status: 400 });
    }
    
    const supabase = getClient();
    
    // Get enrollment
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('*, courses(*)')
      .eq('user_id', user!.id)
      .eq('courses.program_slug', programSlug || 'hvac-epa-608')
      .eq('status', 'active')
      .single();
    
    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled' }, { status: 404 });
    }
    
    // Load blueprint
    const blueprint = await loadBlueprintWithProgram(supabase, { 
      programId: enrollment.courses.program_id 
    });
    
    if (!blueprint) {
      return NextResponse.json({ error: 'Blueprint not found' }, { status: 404 });
    }
    
    // Find module and lesson
    let foundModule: BlueprintModule | undefined;
    let foundLesson: { slug: string; title: string } | undefined;
    
    for (const module of blueprint.modules) {
      const lesson = module.lessons?.find(l => l.slug === lessonSlug);
      if (lesson) {
        foundModule = module;
        foundLesson = lesson;
        break;
      }
    }
    
    if (!foundModule || !foundLesson) {
      return NextResponse.json({ error: 'Lesson not found in blueprint' }, { status: 404 });
    }
    
    // Get interaction specs
    const specs = foundModule.interactionSpecs;
    
    // Fetch progress for this lesson
    const { data: interactionProgress } = await supabase
      .from('interaction_progress')
      .select('*')
      .eq('learner_id', user!.id)
      .eq('lesson_slug', lessonSlug);
    
    // Fetch flashcard progress
    const { data: flashcardProgress } = await supabase
      .from('flashcard_reviews')
      .select('*')
      .eq('learner_id', user!.id)
      .eq('lesson_slug', lessonSlug);
    
    // Build interactions from specs
    const interactions = buildInteractions(specs, foundModule, lessonSlug, interactionProgress || []);
    const flashcards = await buildFlashcards(supabase, blueprint.id, lessonSlug, flashcardProgress || [], user!.id);
    
    return NextResponse.json({
      success: true,
      lessonSlug,
      moduleSlug: foundModule.slug,
      interactions,
      flashcards,
      meta: {
        specs,
        totalInteractions: interactions.length,
        completedInteractions: interactions.filter(i => i.completed).length
      }
    });
    
  } catch (error) {
    console.error('[Interactions API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load interactions' },
      { status: 500 }
    );
  }
}

interface InteractionSpec {
  includeKnowledgeChecks: boolean;
  includeScenarios: boolean;
  includeFlashcards: boolean;
  includeClickToReveal: boolean;
  includeDragDrop: boolean;
  includeMatching: boolean;
  includeCaseStudies: boolean;
  includeSimulations: boolean;
  includeDecisionTrees: boolean;
  knowledgeCheckCount: number;
  scenarioCount: number;
  flashcardCount: number;
  matchingCount: number;
  caseStudyCount: number;
  simulationCount: number;
}

function buildInteractions(
  specs: InteractionSpec | undefined,
  module: BlueprintModule,
  lessonSlug: string,
  progress: Array<Record<string, unknown>>
): Interaction[] {
  if (!specs) return [];
  
  const interactions: Interaction[] = [];
  const progressMap = new Map(
    progress.map(p => [p.interaction_type as string, p])
  );
  
  // Knowledge Checks
  if (specs.includeKnowledgeChecks) {
    for (let i = 0; i < specs.knowledgeCheckCount; i++) {
      const id = `${lessonSlug}-kc-${i + 1}`;
      const stored = progressMap.get(id);
      interactions.push({
        id,
        type: 'knowledge-check',
        title: `Knowledge Check ${i + 1}`,
        position: getPosition('inline', i, specs.knowledgeCheckCount),
        completed: !!stored?.completed,
        score: stored?.score as number | undefined,
        attempts: (stored?.attempts as number) || 0,
        data: {
          // Will be populated from AI generator or question bank
          questionCount: 3,
          questionTypes: ['multiple-choice', 'true-false']
        }
      });
    }
  }
  
  // Scenarios
  if (specs.includeScenarios) {
    for (let i = 0; i < specs.scenarioCount; i++) {
      const id = `${lessonSlug}-scenario-${i + 1}`;
      const stored = progressMap.get(id);
      interactions.push({
        id,
        type: 'scenario',
        title: `Scenario ${i + 1}`,
        position: 'checkpoint',
        completed: !!stored?.completed,
        score: stored?.score as number | undefined,
        attempts: (stored?.attempts as number) || 0,
        data: {
          // Will be populated from AI generator
          competencyKeys: module.competencies?.map(c => c.competencyKey) || []
        }
      });
    }
  }
  
  // Click-to-Reveal
  if (specs.includeClickToReveal) {
    const id = `${lessonSlug}-ctr`;
    const stored = progressMap.get(id);
    interactions.push({
      id,
      type: 'click-to-reveal',
      title: 'Interactive Diagram',
      position: 'inline',
      completed: !!stored?.completed,
      score: stored?.score as number | undefined,
      attempts: (stored?.attempts as number) || 0,
      data: {
        // Will be populated from AI generator
        hotspotsRequired: 3
      }
    });
  }
  
  // Drag-and-Drop
  if (specs.includeDragDrop) {
    const id = `${lessonSlug}-dd`;
    const stored = progressMap.get(id);
    interactions.push({
      id,
      type: 'drag-drop',
      title: 'Matching Activity',
      position: 'inline',
      completed: !!stored?.completed,
      score: stored?.score as number | undefined,
      attempts: (stored?.attempts as number) || 0,
      data: {
        type: 'match',
        itemCount: specs.matchingCount || 4
      }
    });
  }
  
  // Matching
  if (specs.includeMatching) {
    for (let i = 0; i < (specs.matchingCount || 1); i++) {
      const id = `${lessonSlug}-match-${i + 1}`;
      const stored = progressMap.get(id);
      interactions.push({
        id,
        type: 'matching',
        title: `Matching Activity ${i + 1}`,
        position: 'inline',
        completed: !!stored?.completed,
        score: stored?.score as number | undefined,
        attempts: (stored?.attempts as number) || 0,
        data: {
          itemCount: 6
        }
      });
    }
  }
  
  // Case Studies
  if (specs.includeCaseStudies) {
    const id = `${lessonSlug}-case`;
    const stored = progressMap.get(id);
    interactions.push({
      id,
      type: 'case-study',
      title: 'Case Study',
      position: 'checkpoint',
      completed: !!stored?.completed,
      score: stored?.score as number | undefined,
      attempts: (stored?.attempts as number) || 0,
      data: {
        questionCount: 5
      }
    });
  }
  
  // Simulations
  if (specs.includeSimulations) {
    const id = `${lessonSlug}-sim`;
    const stored = progressMap.get(id);
    interactions.push({
      id,
      type: 'simulation',
      title: 'Virtual Lab',
      position: 'end',
      completed: !!stored?.completed,
      score: stored?.score as number | undefined,
      attempts: (stored?.attempts as number) || 0,
      data: {
        category: module.domainKey
      }
    });
  }
  
  // Decision Trees
  if (specs.includeDecisionTrees) {
    const id = `${lessonSlug}-dt`;
    const stored = progressMap.get(id);
    interactions.push({
      id,
      type: 'decision-tree',
      title: 'Decision Practice',
      position: 'checkpoint',
      completed: !!stored?.completed,
      score: stored?.score as number | undefined,
      attempts: (stored?.attempts as number) || 0,
      data: {}
    });
  }
  
  return interactions;
}

interface Interaction {
  id: string;
  type: string;
  title: string;
  position: string;
  completed: boolean;
  score?: number;
  attempts: number;
  data: Record<string, unknown>;
}

function getPosition(type: string, index: number, total: number): string {
  if (index === 0) return 'inline';
  if (index === total - 1) return 'end';
  return 'inline';
}

async function buildFlashcards(
  supabase: unknown,
  blueprintId: string,
  lessonSlug: string,
  progress: Array<Record<string, unknown>>,
  userId: string
): Promise<Flashcard[]> {
  // Get flashcards for this lesson from DB (generated by AI)
  const { data } = await (supabase as { from: Function }).from('flashcards')
    .select('*')
    .eq('blueprint_id', blueprintId)
    .eq('lesson_slug', lessonSlug);
  
  if (!data) return [];
  
  return (data as Array<Record<string, unknown>>).map(card => {
    const reviewProgress = progress.find(p => p.card_id === card.id);
    
    return {
      id: card.id as string,
      front: card.front as string,
      back: card.back as string,
      tags: card.tags as string[] || [],
      mastered: (reviewProgress?.quality as number) >= 4,
      dueForReview: true, // Will be calculated from SM-2 algorithm
      reviewCount: (reviewProgress?.review_count as number) || 0,
      lastReviewed: reviewProgress?.last_reviewed as string | null
    };
  });
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  tags: string[];
  mastered: boolean;
  dueForReview: boolean;
  reviewCount: number;
  lastReviewed: string | null;
}
