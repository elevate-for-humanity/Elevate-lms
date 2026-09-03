/**
 * Course Generation Worker
 * 
 * Background worker that processes course generation jobs.
 * Uses chunked generation to avoid memory issues:
 * 1. Fetch O*NET/CareerOneStop/BLS data
 * 2. Generate course outline
 * 3. Generate each module sequentially
 * 4. Generate each lesson with quiz
 * 5. Store everything to Supabase + R2
 * 6. Mark course as ready for review
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ModelRouter, callModel, type TaskType } from './model-router';
import { logger } from '@/lib/logger';

// Build-safe: lazily create the Supabase client at runtime
let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    _supabase = createClient(supabaseUrl, supabaseKey);
  }
  return _supabase;
}

// Type for course_generation_jobs table
interface CourseJobRecord {
  id: string;
  status: string | null;
  course_title: string | null;
  course_description: string | null;
  user_id: string | null;
  tenant_id: string | null;
  generated_course_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Extended fields that may be stored in metadata or added later
  occupation?: string;
  soc_code?: string;
  credential_type?: string;
  target_hours?: number;
  delivery_mode?: string;
  target_audience?: string;
  retry_count?: number;
}

const modelRouter = new ModelRouter();

// O*NET API integration
async function fetchONetData(socCode: string) {
  const apiKey = process.env.ONET_API_KEY;
  if (!apiKey) {
    console.info('O*NET API key not configured, using fallback data');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.mycareersintfd.gov/v1/careers/${socCode}`,
      { headers: { 'Authorization': `Bearer ${apiKey}` } }
    );
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('O*NET API error:', error);
  }
  return null;
}

// BLS API integration
async function fetchBLSData(socCode: string) {
  const apiKey = process.env.BLS_API_KEY;
  if (!apiKey) {
    console.info('BLS API key not configured, using fallback data');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.bls.gov/publicAPI/v2/timeseries/data/${socCode}`,
      { headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify({ seriesid: [socCode], startyear: '2020', endyear: '2024' })
      }
    );
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('BLS API error:', error);
  }
  return null;
}

// CareerOneStop API integration
async function fetchCareerOneStopData(keyword: string) {
  const apiKey = process.env.CAREERONESTOP_API_KEY;
  if (!apiKey) {
    console.info('CareerOneStop API key not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.careeronestop.org/v1/occupation/${apiKey}/${encodeURIComponent(keyword)}`,
      { headers: { 'Authorization': `Bearer ${apiKey}` } }
    );
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('CareerOneStop API error:', error);
  }
  return null;
}

interface GenerationProgress {
  totalSteps: number;
  currentStep: number;
  percent: number;
}

async function updateJobProgress(
  jobId: string,
  jobStatus: string,
  step: string,
  progress: number
) {
  const supabase = getSupabase();
  await supabase
    .from('course_generation_jobs')
    .update({
      status: jobStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);
}

async function generateCourseOutline(
  job: CourseJobRecord,
  onetData: unknown,
  blsData: unknown,
  cosData: unknown
): Promise<{ 
  title: string; 
  subtitle?: string; 
  description?: string; 
  modules: Array<{ 
    title: string; 
    description: string; 
    lessons: number;
    objectives?: string[];
  }> 
}> {
  const model = modelRouter.selectModel('course_generation');
  
  const systemPrompt = `You are an expert instructional designer for workforce development programs.
Generate a course outline based on the provided occupation data.
Return ONLY valid JSON with this structure:
{
  "title": "Course Title",
  "subtitle": "One sentence description",
  "description": "2-3 sentences about the course",
  "modules": [
    {
      "title": "Module 1 Title",
      "description": "Module description",
      "lessons": 4,
      "objectives": ["Objective 1", "Objective 2"]
    }
  ]
}
The course should cover ${job.target_hours || 40} hours of training.`;

  const userPrompt = `Generate a comprehensive course outline for: ${job.course_title || 'Untitled Course'}
Occupation: ${job.occupation}
SOC Code: ${job.soc_code}
Credential Type: ${job.credential_type}
Target Hours: ${job.target_hours || 40}
Target Audience: ${job.target_audience || 'Adult learners seeking career advancement'}

${onetData ? `O*NET Data: ${JSON.stringify(onetData, null, 2)}` : ''}
${blsData ? `BLS Data: ${JSON.stringify(blsData, null, 2)}` : ''}
${cosData ? `CareerOneStop Data: ${JSON.stringify(cosData, null, 2)}` : ''}`;

  try {
    const response = await callModel(
      model,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.7, maxTokens: 8192 }
    );

    // Extract JSON from response with safe parsing
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        const err = parseError instanceof Error ? parseError : new Error(String(parseError));
        logger.error('[course-generation-worker] JSON parse error in generateCourseOutline', err, {
          raw: jsonMatch[0].slice(0, 200)
        });
      }
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('[course-generation-worker] Error generating outline', err);
    throw error;
  }

  throw new Error('Failed to parse course outline from AI response');
}

async function generateLessonContent(
  job: CourseJobRecord,
  lessonTitle: string,
  lessonNumber: number,
  moduleTitle: string
): Promise<{
  content: string;
  summary: string;
  objectives: string[];
  quizQuestions: Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
}> {
  const model = modelRouter.selectModel('course_generation');

  const systemPrompt = `You are an expert instructional designer for workforce development.
Generate lesson content for a ${job.delivery_mode || 'online'} course.
Return ONLY valid JSON with this structure:
{
  "content": "Full HTML lesson content with proper formatting",
  "summary": "2-3 sentence summary",
  "objectives": ["Learner objective 1", "Learner objective 2", "Learner objective 3"],
  "reflectionPrompt": "An open-ended reflection question",
  "quizQuestions": [
    {
      "question": "Quiz question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this is correct"
    }
  ]
}
Content should include: introduction, main concepts, examples, key takeaways.`;

  const userPrompt = `Generate lesson content for:
Module: ${moduleTitle}
Lesson: ${lessonTitle}
Lesson Number: ${lessonNumber} of approximately 4-6 lessons per module
Target Audience: ${job.target_audience || 'Adult learners'}
Credential: ${job.credential_type}
Delivery Mode: ${job.delivery_mode || 'online'}`;

  try {
    const response = await callModel(
      model,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.7, maxTokens: 16384 }
    );

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        const err = parseError instanceof Error ? parseError : new Error(String(parseError));
        logger.error('[course-generation-worker] JSON parse error in generateLessonContent', err, {
          raw: jsonMatch[0].slice(0, 200)
        });
      }
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('[course-generation-worker] Error generating lesson', err);
    throw error;
  }

  throw new Error('Failed to parse lesson content from AI response');
}

export async function processCourseGenerationJob(jobId: string): Promise<void> {
  console.info(`Processing course generation job: ${jobId}`);
  const supabase = getSupabase();

  // Fetch job details
  const { data: job, error: jobError } = await supabase
    .from('course_generation_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (jobError || !job) {
    console.error('Job not found:', jobError);
    return;
  }

  const typedJob = job as CourseJobRecord;

  if (typedJob.status !== 'queued') {
    console.info(`Job ${jobId} is not queued, skipping`);
    return;
  }

  try {
    // Update status to planning
    await updateJobProgress(jobId, 'planning', 'Fetching occupation data', 5);

    // Fetch external data (O*NET, BLS, CareerOneStop)
    const [onetData, blsData, cosData] = await Promise.all([
      typedJob.soc_code ? fetchONetData(typedJob.soc_code) : Promise.resolve(null),
      typedJob.soc_code ? fetchBLSData(typedJob.soc_code) : Promise.resolve(null),
      typedJob.occupation ? fetchCareerOneStopData(typedJob.occupation) : Promise.resolve(null),
    ]);

    // Generate course outline
    await updateJobProgress(jobId, 'generating', 'Generating course outline', 10);
    const outline = await generateCourseOutline(typedJob, onetData, blsData, cosData);

    // Create generated course record
    const { data: course, error: courseError } = await supabase
      .from('generated_courses')
      .insert({
        job_id: jobId,
        title: outline.title || typedJob.course_title || 'Untitled Course',
        subtitle: outline.subtitle,
        description: outline.description || typedJob.course_description,
        occupation: typedJob.occupation,
        soc_code: typedJob.soc_code,
        credential_type: typedJob.credential_type,
        target_hours: typedJob.target_hours,
        delivery_mode: typedJob.delivery_mode,
        target_audience: typedJob.target_audience,
        status: 'draft',
        metadata: { onetData, blsData, cosData },
      })
      .select()
      .single();

    if (courseError) throw courseError;
    if (!course) throw new Error('Failed to create course record');

    // Calculate total steps for progress
    const totalModules = outline.modules?.length || 5;
    const lessonsPerModule = 4;
    const totalLessons = totalModules * lessonsPerModule;
    const totalSteps = totalModules + totalLessons + 1; // modules + lessons + quiz
    let currentStep = 0;

    // Generate modules and lessons
    for (const module of outline.modules || []) {
      currentStep++;
      const progress = 10 + Math.floor((currentStep / totalSteps) * 80);
      await updateJobProgress(jobId, 'generating', `Generating module: ${module.title}`, progress);

      // Create module record
      const { data: moduleRecord, error: moduleError } = await supabase
        .from('generated_modules')
        .insert({
          course_id: course.id,
          job_id: jobId,
          sort_order: outline.modules.indexOf(module) + 1,
          title: module.title,
          description: module.description,
          objectives: module.objectives || [],
          estimated_hours: Math.ceil((typedJob.target_hours || 40) / totalModules),
        })
        .select()
        .single();

      if (moduleError) throw moduleError;
      if (!moduleRecord) throw new Error('Failed to create module record');

      // Generate lessons for this module
      for (let lessonNum = 1; lessonNum <= (module.lessons || lessonsPerModule); lessonNum++) {
        currentStep++;
        const progress = 10 + Math.floor((currentStep / totalSteps) * 80);
        const lessonTitle = `Lesson ${lessonNum}: ${module.title} - Part ${lessonNum}`;
        await updateJobProgress(jobId, 'generating', `Generating lesson: ${lessonTitle}`, progress);

        // Generate lesson content
        const lessonContent = await generateLessonContent(
          typedJob,
          lessonTitle,
          lessonNum,
          module.title
        );

        // Save lesson
        const { data: lessonRecord, error: lessonError } = await supabase
          .from('generated_lessons')
          .insert({
            module_id: moduleRecord.id,
            course_id: course.id,
            job_id: jobId,
            lesson_number: lessonNum,
            title: lessonTitle,
            description: lessonContent.summary,
            content: lessonContent.content,
            summary: lessonContent.summary,
            objectives: lessonContent.objectives,
            // reflectionPrompt not available
            duration_minutes: 30,
            order_index: lessonNum,
          })
          .select('id')
          .single();

        if (lessonError) throw lessonError;
        if (!lessonRecord) throw new Error('Failed to create lesson record');

        // Save quiz if questions generated
        if (lessonContent.quizQuestions?.length > 0) {
          await supabase.from('generated_quizzes').insert({
            lesson_id: lessonRecord?.id,
            course_id: course.id,
            job_id: jobId,
            title: `${lessonTitle} Quiz`,
            questions: lessonContent.quizQuestions,
            passing_score: 70,
          });
        }
      }
    }

    // Update course totals
    await supabase.rpc('update_course_totals', { course_id: course.id });

    // Mark job as complete
    await updateJobProgress(jobId, 'reviewing', 'Course generated, ready for review', 100);
    await supabase
      .from('course_generation_jobs')
      .update({
        status: 'reviewing',
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    console.info(`Course generation job ${jobId} completed successfully`);

  } catch (error) {
    console.error(`Error processing job ${jobId}:`, error);
    
    // Update job with error
    await supabase
      .from('course_generation_jobs')
      .update({
        status: 'failed',
      })
      .eq('id', jobId);
  }
}

// Main worker loop
export async function startCourseGenerationWorker() {
  console.info('Starting course generation worker...');

  // Poll for queued jobs every 10 seconds
  setInterval(async () => {
    try {
      const supabase = getSupabase();
      const { data: jobs } = await supabase
        .from('course_generation_jobs')
        .select('id')
        .eq('status', 'queued')
        .order('created_at', { ascending: true })
        .limit(1);

      if (jobs && jobs.length > 0) {
        await processCourseGenerationJob(jobs[0].id);
      }
    } catch (error) {
      console.error('Worker error:', error);
    }
  }, 10000);
}