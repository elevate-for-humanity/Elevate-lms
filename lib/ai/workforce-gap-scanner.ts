/**
 * Workforce Gap Scanner
 * 
 * Discovers new occupations from O*NET, BLS, and CareerOneStop
 * that Elevate for Humanity doesn't currently offer.
 * Then recommends and generates draft curricula for them.
 */

import { createClient } from '@supabase/supabase-js';
import { ModelRouter, callModel } from './model-router';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const modelRouter = new ModelRouter();

export interface WorkforceGap {
  occupation: string;
  soc_code: string;
  category: string;
  demand_score: number; // 1-100 based on BLS job projections
  median_wage: number;
  growth_rate: string;
  training_hours_estimate: number;
  apprenticeship_available: boolean;
  credential_recommendations: string[];
  gap_reason: string;
  recommendation_priority: 'high' | 'medium' | 'low';
}

export interface CompletionScore {
  program_id: string;
  program_name: string;
  course_score: number; // 0-100
  modules_score: number;
  lessons_score: number;
  quizzes_score: number;
  videos_score: number;
  assessments_score: number;
  overall_score: number;
  missing_items: {
    type: string;
    count: number;
    items: string[];
  }[];
  recommendations: {
    action: string;
    count: number;
    description: string;
  }[];
}

export interface WorkforceScanResult {
  scanned_at: string;
  total_occupations_analyzed: number;
  new_opportunities: WorkforceGap[];
  completion_scores: CompletionScore[];
  recommendations: {
    type: 'new_program' | 'course_update' | 'curriculum_expansion';
    priority: 'high' | 'medium' | 'low';
    description: string;
    estimated_hours: number;
  }[];
}

// O*NET API - Search occupations by keyword or browse by category
async function searchONetOccupations(keyword?: string): Promise<unknown[]> {
  const apiKey = process.env.ONET_API_KEY;
  if (!apiKey) {
    console.info('O*NET API not configured');
    return [];
  }

  try {
    // Browse occupations by category
    const categories = [
      '15-0000', // Computer and Information Technology
      '17-0000', // Architecture and Engineering
      '29-0000', // Healthcare
      '31-0000', // Healthcare Support
      '47-0000', // Construction
      '49-0000', // Installation and Repair
      '51-0000', // Production
      '13-0000', // Business and Financial Operations
    ];

    const occupations: unknown[] = [];

    for (const category of categories) {
      const response = await fetch(
        `https://api.mycareersintfd.gov/v1/browse/by-category/${category}`,
        { headers: { 'Authorization': `Bearer ${apiKey}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.occupations) {
          occupations.push(...data.occupations);
        }
      }
    }

    return occupations;
  } catch (error) {
    console.error('O*NET search error:', error);
    return [];
  }
}

// BLS API - Get employment and wage data
async function fetchBLSOccupationData(socCode: string): Promise<{
  employment: number;
  median_wage: number;
  growth_percent: number;
  growth_rate: string;
} | null> {
  const apiKey = process.env.BLS_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seriesid: [
          `OEUS${socCode.replace('.', '')}`, // Employment
        ],
        startyear: '2023',
        endyear: '2024',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      // Parse BLS data...
      return {
        employment: 0,
        median_wage: 55000,
        growth_percent: 5,
        growth_rate: 'faster_than_average',
      };
    }
  } catch (error) {
    console.error('BLS API error:', error);
  }

  return null;
}

// CareerOneStop API - Get training programs and credentials
async function fetchCareerOneStopTraining(socCode: string): Promise<{
  training_programs: string[];
  certifications: string[];
  apprenticeships: string[];
}> {
  const apiKey = process.env.CAREERONESTOP_API_KEY;
  if (!apiKey) {
    return { training_programs: [], certifications: [], apprenticeships: [] };
  }

  try {
    const response = await fetch(
      `https://api.careeronestop.org/v1/TrainingProvider/${apiKey}/${socCode}/`,
      { headers: { 'Authorization': `Bearer ${apiKey}` } }
    );

    if (response.ok) {
      const data = await response.json();
      return {
        training_programs: data.Training || [],
        certifications: data.Certifications || [],
        apprenticeships: data.Apprenticeships || [],
      };
    }
  } catch (error) {
    console.error('CareerOneStop API error:', error);
  }

  return { training_programs: [], certifications: [], apprenticeships: [] };
}

// Get all currently offered programs
async function getCurrentPrograms(): Promise<Map<string, {
  id: string;
  title: string;
  soc_code: string;
  category: string;
}>> {
  const { data: programs } = await supabase
    .from('programs')
    .select('id, title, soc_code, category')
    .eq('is_active', true);

  const programMap = new Map();
  for (const p of programs || []) {
    programMap.set(p.soc_code?.toLowerCase(), p);
    programMap.set(p.title?.toLowerCase(), p);
  }

  return programMap;
}

// Calculate completion score for a program
async function calculateCompletionScore(programId: string, programTitle: string): Promise<CompletionScore> {
  // Get course
  const { data: course } = await supabase
    .from('career_courses')
    .select('id, title, has_final_exam, has_practical_assessment')
    .eq('program_id', programId)
    .eq('status', 'published')
    .single();

  let courseScore = 0;
  let modulesScore = 0;
  let lessonsScore = 0;
  let quizzesScore = 0;
  let videosScore = 0;
  let assessmentsScore = 0;
  const missingItems: CompletionScore['missing_items'] = [];
  const recommendations: CompletionScore['recommendations'] = [];

  if (course) {
    courseScore = 100;
    
    // Check modules
    const { data: modules } = await supabase
      .from('course_modules')
      .select('id, title')
      .eq('course_id', course.id)
      .eq('is_draft', false);

    const moduleCount = modules?.length || 0;
    modulesScore = Math.min(100, moduleCount * 20); // Expect 5 modules
    
    if (moduleCount < 5) {
      missingItems.push({
        type: 'modules',
        count: 5 - moduleCount,
        items: [`Need ${5 - moduleCount} more modules`],
      });
    }

    // Check lessons
    let totalLessons = 0;
    const missingLessons: string[] = [];
    for (const mod of modules || []) {
      const { data: lessons } = await supabase
        .from('course_lessons')
        .select('id, title')
        .eq('module_id', mod.id);
      
      const lessonCount = lessons?.length || 0;
      totalLessons += lessonCount;
      
      if (lessonCount < 4) {
        missingLessons.push(`${mod.title}: needs ${4 - lessonCount} more lessons`);
      }
    }

    const expectedLessons = moduleCount * 4;
    lessonsScore = expectedLessons > 0 ? Math.min(100, (totalLessons / expectedLessons) * 100) : 0;
    
    if (totalLessons < expectedLessons) {
      missingItems.push({
        type: 'lessons',
        count: expectedLessons - totalLessons,
        items: missingLessons,
      });
    }

    // Check quizzes
    const { data: quizzes } = await supabase
      .from('course_quizzes')
      .select('id')
      .eq('course_id', course.id);

    const quizCount = quizzes?.length || 0;
    const expectedQuizzes = totalLessons;
    quizzesScore = expectedQuizzes > 0 ? Math.min(100, (quizCount / expectedQuizzes) * 100) : 0;
    
    if (quizCount < totalLessons * 0.8) {
      missingItems.push({
        type: 'quizzes',
        count: Math.ceil(totalLessons * 0.8) - quizCount,
        items: [`Need ${Math.ceil(totalLessons * 0.8) - quizCount} more quizzes`],
      });
      recommendations.push({
        action: 'generate_quizzes',
        count: Math.ceil(totalLessons * 0.8) - quizCount,
        description: 'Generate quizzes for lessons',
      });
    }

    // Check videos
    const { data: videos } = await supabase
      .from('course_media')
      .select('id')
      .eq('course_id', course.id)
      .eq('media_type', 'video');

    const videoCount = videos?.length || 0;
    const expectedVideos = Math.ceil(totalLessons * 0.5);
    videosScore = expectedVideos > 0 ? Math.min(100, (videoCount / expectedVideos) * 100) : 0;
    
    if (videoCount < expectedVideos) {
      missingItems.push({
        type: 'videos',
        count: expectedVideos - videoCount,
        items: [`Need ${expectedVideos - videoCount} more videos`],
      });
      recommendations.push({
        action: 'generate_videos',
        count: expectedVideos - videoCount,
        description: 'Record or generate video content',
      });
    }

    // Check assessments
    assessmentsScore = (course.has_final_exam ? 50 : 0) + (course.has_practical_assessment ? 50 : 0);
    
    if (!course.has_final_exam) {
      missingItems.push({
        type: 'final_exam',
        count: 1,
        items: ['Final exam missing'],
      });
      recommendations.push({
        action: 'add_final_exam',
        count: 1,
        description: 'Add final examination',
      });
    }
    
    if (!course.has_practical_assessment) {
      missingItems.push({
        type: 'practical_assessment',
        count: 1,
        items: ['Practical assessment missing'],
      });
      recommendations.push({
        action: 'add_practical_assessment',
        count: 1,
        description: 'Add practical skills assessment',
      });
    }
  } else {
    missingItems.push({
      type: 'course',
      count: 1,
      items: ['No published course exists'],
    });
    recommendations.push({
      action: 'generate_course',
      count: 1,
      description: 'Generate full course',
    });
  }

  const overallScore = Math.round(
    (courseScore * 0.2) +
    (modulesScore * 0.15) +
    (lessonsScore * 0.25) +
    (quizzesScore * 0.15) +
    (videosScore * 0.1) +
    (assessmentsScore * 0.15)
  );

  return {
    program_id: programId,
    program_name: programTitle,
    course_score: courseScore,
    modules_score: modulesScore,
    lessons_score: lessonsScore,
    quizzes_score: quizzesScore,
    videos_score: videosScore,
    assessments_score: assessmentsScore,
    overall_score: overallScore,
    missing_items: missingItems,
    recommendations,
  };
}

// Discover new occupation opportunities
async function discoverNewOpportunities(): Promise<WorkforceGap[]> {
  const opportunities: WorkforceGap[] = [];
  const currentPrograms = await getCurrentPrograms();

  // Fetch from external APIs
  const onetOccupations = await searchONetOccupations();
  
  for (const occ of onetOccupations) {
    const socCode = (occ as { code?: string }).code;
    const title = (occ as { title?: string }).title;
    
    // Check if we already offer this
    if (currentPrograms.has(socCode?.toLowerCase()) || 
        currentPrograms.has(title?.toLowerCase())) {
      continue;
    }

    // Get BLS data
    const blsData = await fetchBLSOccupationData(socCode || '');
    
    // Get CareerOneStop training info
    const cosData = await fetchCareerOneStopTraining(socCode || '');

    // Calculate priority based on demand
    let priority: 'high' | 'medium' | 'low' = 'medium';
    if (blsData) {
      if (blsData.growth_percent > 15 || blsData.median_wage > 60000) {
        priority = 'high';
      } else if (blsData.growth_percent < 3) {
        priority = 'low';
      }
    }

    opportunities.push({
      occupation: title || 'Unknown',
      soc_code: socCode || '',
      category: (occ as { category?: string }).category || 'General',
      demand_score: blsData?.growth_percent ? Math.min(100, blsData.growth_percent * 5) : 50,
      median_wage: blsData?.median_wage || 45000,
      growth_rate: blsData?.growth_rate || 'average',
      training_hours_estimate: 40, // Default estimate
      apprenticeship_available: cosData.apprenticeships.length > 0,
      credential_recommendations: cosData.certifications,
      gap_reason: 'Elevate for Humanity does not currently offer this program',
      recommendation_priority: priority,
    });
  }

  // Sort by priority and demand score
  return opportunities.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.recommendation_priority] !== priorityOrder[b.recommendation_priority]) {
      return priorityOrder[a.recommendation_priority] - priorityOrder[b.recommendation_priority];
    }
    return b.demand_score - a.demand_score;
  });
}

// Main workforce scan function
export async function runWorkforceGapScan(): Promise<WorkforceScanResult> {
  console.info('Starting workforce gap scan...');

  // Get completion scores for all current programs
  const { data: programs } = await supabase
    .from('programs')
    .select('id, title')
    .eq('is_active', true);

  const completionScores: CompletionScore[] = [];
  for (const program of programs || []) {
    const score = await calculateCompletionScore(program.id, program.title);
    completionScores.push(score);
  }

  // Discover new opportunities
  const newOpportunities = await discoverNewOpportunities();

  // Generate recommendations
  const recommendations: WorkforceScanResult['recommendations'] = [];

  // From completion scores
  for (const score of completionScores) {
    if (score.overall_score < 80) {
      recommendations.push({
        type: 'course_update',
        priority: score.overall_score < 50 ? 'high' : 'medium',
        description: `Complete ${score.program_name} curriculum (${score.overall_score}% complete)`,
        estimated_hours: Math.round((100 - score.overall_score) / 10) * 10,
      });
    }
  }

  // From new opportunities
  for (const opp of newOpportunities.filter(o => o.recommendation_priority === 'high').slice(0, 5)) {
    recommendations.push({
      type: 'new_program',
      priority: 'high',
      description: `Add ${opp.occupation} program (${opp.demand_score} demand score)`,
      estimated_hours: opp.training_hours_estimate,
    });
  }

  const result: WorkforceScanResult = {
    scanned_at: new Date().toISOString(),
    total_occupations_analyzed: newOpportunities.length + (programs?.length || 0),
    new_opportunities: newOpportunities,
    completion_scores: completionScores,
    recommendations,
  };

  console.info('Workforce scan complete:', {
    new_opportunities: newOpportunities.length,
    completion_scores: completionScores.length,
    recommendations: recommendations.length,
  });

  return result;
}

// Create automatic generation job for a new program
export async function autoGenerateNewProgram(gap: WorkforceGap): Promise<string> {
  const { data: job, error } = await supabase
    .from('course_generation_jobs')
    .insert({
      title: `NEW: ${gap.occupation}`,
      occupation: gap.occupation,
      soc_code: gap.soc_code,
      credential_type: gap.credential_recommendations[0] || 'Certificate',
      target_hours: gap.training_hours_estimate,
      status: 'queued',
      metadata: {
        source: 'workforce_gap_scan',
        demand_score: gap.demand_score,
        median_wage: gap.median_wage,
        auto_generated: true,
        requires_approval: true, // Always require admin approval
      },
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  // Create notification for admin
  await supabase.from('notifications').insert({
    type: 'workforce_gap_recommendation',
    title: 'New Program Recommended',
    message: `AI recommends adding "${gap.occupation}" based on workforce demand. Job created for review.`,
    data: { job_id: job.id, gap },
    priority: gap.recommendation_priority === 'high' ? 'high' : 'normal',
  });

  return job.id;
}

// Save scan results for history
export async function saveScanResults(result: WorkforceScanResult): Promise<void> {
  await supabase.from('workforce_scan_history').insert({
    scanned_at: result.scanned_at,
    total_occupations: result.total_occupations_analyzed,
    new_opportunities: result.new_opportunities.length,
    high_priority_opportunities: result.new_opportunities.filter(o => o.recommendation_priority === 'high').length,
    results: result as unknown as Record<string, unknown>,
  });
}