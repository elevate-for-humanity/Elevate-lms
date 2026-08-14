/**
 * GET /api/learner/competencies
 * Returns competency progress for the enrolled course.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/requireAuth';
import { createClient } from '@/lib/supabase/server';
import { loadBlueprintWithProgram } from '@/lib/course-factory/blueprint-loader';
import type { CredentialBlueprint } from '@/lib/curriculum/blueprints/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createClient();
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('*, courses(*)')
      .eq('user_id', user!.id)
      .eq('status', 'active')
      .single();

    if (!enrollment) return NextResponse.json({ error: 'Not enrolled' }, { status: 404 });

    const loaded = await loadBlueprintWithProgram(supabase, { programId: enrollment.courses.program_id });
    if (!loaded) return NextResponse.json({ error: 'Blueprint not found' }, { status: 404 });
    const blueprint = loaded.blueprint;

    const { data: progressData } = await supabase
      .from('competency_progress')
      .select('*')
      .eq('learner_id', user!.id)
      .eq('course_id', enrollment.course_id);

    const competencies = buildCompetencyTree(blueprint, progressData || []);
    const overallMastery = competencies.length
      ? Math.round(competencies.reduce((sum, competency) => sum + competency.currentLevel, 0) / competencies.length)
      : 0;

    return NextResponse.json({
      success: true,
      courseId: enrollment.course_id,
      programSlug: blueprint.programSlug,
      overallMastery,
      totalCompetencies: competencies.length,
      verifiedCompetencies: competencies.filter((competency) => competency.verified).length,
      competencies,
    });
  } catch (error) {
    console.error('[Competencies API] Error:', error);
    return NextResponse.json({ error: 'Failed to load competencies' }, { status: 500 });
  }
}

interface CompetencyNode {
  competencyKey: string;
  competencyName: string;
  currentLevel: number;
  targetLevel: number;
  verified: boolean;
  modules: string[];
  requiredSkills: number;
  completedSkills: number;
  status: 'not-started' | 'in-progress' | 'mastered' | 'verified';
}

function buildCompetencyTree(
  blueprint: CredentialBlueprint,
  progressData: Array<Record<string, unknown>>,
): CompetencyNode[] {
  const map = new Map<string, CompetencyNode>();
  const progress = new Map(progressData.map((row) => [row.competency_key as string, row]));

  for (const blueprintModule of blueprint.modules) {
    for (const competency of blueprintModule.competencies || []) {
      const stored = progress.get(competency.competencyKey);
      const existing = map.get(competency.competencyKey);
      if (existing) {
        existing.modules.push(blueprintModule.slug);
        continue;
      }

      const level = (stored?.current_level as number) || 0;
      const verified = Boolean(stored?.verified);
      map.set(competency.competencyKey, {
        competencyKey: competency.competencyKey,
        competencyName: competency.competencyKey.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
        currentLevel: level,
        targetLevel: 100,
        verified,
        modules: [blueprintModule.slug],
        requiredSkills: competency.minimumTouchpoints,
        completedSkills: Math.floor((level / 100) * competency.minimumTouchpoints),
        status: verified ? 'verified' : level >= 100 ? 'mastered' : level > 0 ? 'in-progress' : 'not-started',
      });
    }
  }

  return [...map.values()];
}
