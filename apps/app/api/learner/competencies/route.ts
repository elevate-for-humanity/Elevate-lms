/**
 * GET /api/learner/competencies
 * 
 * Returns competency progress for the enrolled course,
 * built from blueprint competency definitions.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/requireAuth';
import { getClient } from '@/lib/supabase/client';
import { loadBlueprintWithProgram } from '@/lib/course-factory/blueprint-loader';
import type { CredentialBlueprint } from '@/lib/curriculum/blueprints/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = request.nextUrl;
    const programSlug = searchParams.get('programSlug');
    
    const supabase = getClient();
    
    // Get enrollment
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('*, courses(*)')
      .eq('user_id', user!.id)
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
    
    // Get competency progress from DB
    const { data: progressData } = await supabase
      .from('competency_progress')
      .select('*')
      .eq('learner_id', user!.id)
      .eq('course_id', enrollment.course_id);
    
    // Build competency structure from blueprint
    const competencies = buildCompetencyTree(blueprint, progressData || []);
    
    // Calculate overall mastery
    const overallMastery = competencies.length > 0
      ? Math.round(competencies.reduce((sum, c) => sum + c.currentLevel, 0) / competencies.length)
      : 0;
    
    return NextResponse.json({
      success: true,
      courseId: enrollment.course_id,
      programSlug: blueprint.programSlug,
      overallMastery,
      totalCompetencies: competencies.length,
      verifiedCompetencies: competencies.filter(c => c.verified).length,
      competencies,
      meta: {
        blueprintId: blueprint.id,
        lastUpdated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[Competencies API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load competencies' },
      { status: 500 }
    );
  }
}

interface CompetencyNode {
  competencyKey: string;
  competencyName: string;
  description: string;
  currentLevel: number;
  targetLevel: number;
  touchpoints: Touchpoint[];
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  modules: string[];
  requiredSkills: number;
  completedSkills: number;
  status: 'not-started' | 'in-progress' | 'mastered' | 'verified';
}

interface Touchpoint {
  type: string;
  sourceId: string;
  sourceTitle: string;
  score: number;
  maxScore: number;
  timestamp: string;
}

function buildCompetencyTree(
  blueprint: CredentialBlueprint,
  progressData: Array<Record<string, unknown>>
): CompetencyNode[] {
  const competencyMap = new Map<string, CompetencyNode>();
  const progressMap = new Map(
    progressData.map(p => [p.competency_key as string, p])
  );
  
  for (const module of blueprint.modules) {
    for (const comp of module.competencies || []) {
      if (!competencyMap.has(comp.competencyKey)) {
        const stored = progressMap.get(comp.competencyKey);
        
        competencyMap.set(comp.competencyKey, {
          competencyKey: comp.competencyKey,
          competencyName: formatCompetencyName(comp.competencyKey),
          description: getCompetencyDescription(comp.competencyKey),
          currentLevel: (stored?.current_level as number) || 0,
          targetLevel: 100,
          touchpoints: (stored?.touchpoints as Touchpoint[]) || [],
          verified: (stored?.verified as boolean) || false,
          verifiedBy: stored?.verified_by as string | undefined,
          verifiedAt: stored?.verified_at as string | undefined,
          modules: [module.slug],
          requiredSkills: comp.minimumTouchpoints,
          completedSkills: stored ? Math.floor(((stored.current_level as number) || 0) / 100 * comp.minimumTouchpoints) : 0,
          status: getCompetencyStatus(stored, comp.minimumTouchpoints)
        });
      } else {
        // Add module to existing competency
        const existing = competencyMap.get(comp.competencyKey)!;
        existing.modules.push(module.slug);
      }
    }
  }
  
  return Array.from(competencyMap.values());
}

function formatCompetencyName(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

function getCompetencyDescription(key: string): string {
  const descriptions: Record<string, string> = {
    sanitation_standards: 'Demonstrates proper sanitation and disinfection procedures',
    disinfection_protocols: 'Follows EPA-registered disinfectant protocols',
    osha_compliance: 'Complies with OSHA workplace safety standards',
    bloodborne_pathogens: 'Handles bloodborne pathogen exposure situations',
    refrigerant_recovery: 'Performs EPA-compliant refrigerant recovery',
    hvac_troubleshooting: 'Diagnoses and troubleshoots HVAC systems',
    electrical_safety: 'Follows electrical safety protocols',
    patient_care: 'Provides basic patient care assistance',
    vital_signs: 'Accurately measures vital signs',
    medication_administration: 'Assists with medication administration',
    // Add more as needed
  };
  
  return descriptions[key] || `Competency in ${formatCompetencyName(key)}`;
}

function getCompetencyStatus(
  stored: Record<string, unknown> | undefined,
  requiredSkills: number
): 'not-started' | 'in-progress' | 'mastered' | 'verified' {
  if (!stored) return 'not-started';
  
  const currentLevel = (stored.current_level as number) || 0;
  
  if (stored.verified) return 'verified';
  if (currentLevel >= 100) return 'mastered';
  if (currentLevel > 0) return 'in-progress';
  return 'not-started';
}
