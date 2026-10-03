import {DevStudioUltimateCourseControl} from '@/lib/devstudio/ultimate-course-control';
import { NextRequest, NextResponse } from 'next/server';

import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import {
  listAgenticEvents,
  listAgenticMessages,
  loadAgenticProject,
} from '@/lib/agentic/project-service';
import { recordMasterStudioArtifact } from '@/lib/studio/master-runtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function searchableWords(value: string): string[] {
  const ignored = new Set([
    'build', 'course', 'complete', 'create', 'finish', 'full', 'generate', 'make', 'please',
    'resume', 'the', 'this', 'with', 'videos',
  ]);
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((word) => word.length >= 3 && !ignored.has(word));
}

async function resolveCanonicalCourseFromGoal(goal: string) {
  const words = searchableWords(goal);
  if (!words.length) return null;

  const db = await requireAdminClient();
  const { data, error } = await db
    .from('courses')
    .select('id,title,slug,program_id')
    .limit(500);
  if (error) throw error;

  const ranked = (data ?? [])
    .map((course) => {
      const haystack = `${course.title ?? ''} ${course.slug ?? ''}`.toLowerCase();
      return { course, score: words.filter((word) => haystack.includes(word)).length };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);
  if (!ranked.length || (ranked[1] && ranked[1].score === ranked[0].score)) return null;
  return ranked[0].course;
}

async function resolveCanonicalProgramFromGoal(goal: string) {
  const words = searchableWords(goal);
  if (!words.length) return null;
  const db = await requireAdminClient();
  const { data, error } = await db.from('programs').select('id,title,name,slug').limit(500);
  if (error) throw error;
  const normalizedGoal = goal.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const ranked = (data ?? []).map((program) => {
    const labels = [program.title, program.name, program.slug]
      .filter((value): value is string => typeof value === 'string' && Boolean(value.trim()))
      .map((value) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim());
    const phrase = Math.max(0, ...labels.filter((label) => label.length >= 4 && normalizedGoal.includes(label)).map((label) => label.length));
    const haystack = labels.join(' ');
    return { program, score: phrase * 100 + words.filter((word) => haystack.includes(word)).length };
  }).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score);
  if (!ranked.length || (ranked[1] && ranked[1].score === ranked[0].score)) return null;
  return ranked[0].program;
}

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const action = text(body.action) ?? 'start';
  const studioRunId = text(body.studioRunId);
  const studioRunStepId = text(body.studioRunStepId);

  let resumedCourseId: string | null = null;
  if(action==='resume-after-review') {
    const projectId=text(body.projectId);
    if(!projectId)return NextResponse.json({error:'projectId is required'},{status:400});
    const project=await loadAgenticProject({projectId,userId:auth.id});
    if(!project || project.target_type!=='course' || !project.target_id)
      return NextResponse.json({error:'Canonical course project not found'},{status:404});
    resumedCourseId=project.target_id;
  } else if(action!=='start') {
    return NextResponse.json({error:`Unsupported action: ${action}`},{status:400});
  }

  const goal = text(body.goal) || (resumedCourseId ? `Resume canonical course ${resumedCourseId}` : null);
  let programId = text(body.programId);
  let programSlug = text(body.programSlug);
  let courseId = resumedCourseId || text(body.courseId);
  if (!goal) return NextResponse.json({ error: 'A course build goal is required.' }, { status: 400 });

  const db = await requireAdminClient();
  if (courseId && !programId && !programSlug) {
    const { data: selectedCourse, error } = await db
      .from('courses')
      .select('id,program_id,slug')
      .eq('id', courseId)
      .maybeSingle();
    if (error) throw error;
    if (!selectedCourse) return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
    programId = text(selectedCourse.program_id);
    programSlug = text(selectedCourse.slug);
  }

  if (!programId && !programSlug && !courseId) {
    const selectedCourse = await resolveCanonicalCourseFromGoal(goal);
    if (selectedCourse) {
      courseId = text(selectedCourse.id);
      programId = text(selectedCourse.program_id);
      programSlug = text(selectedCourse.slug);
    }
  }
  if (!programId && !programSlug && !courseId) {
    const selectedProgram = await resolveCanonicalProgramFromGoal(goal);
    if (selectedProgram) {
      programId = text(selectedProgram.id);
      programSlug = text(selectedProgram.slug);
    }
  }
  if (!programId && !programSlug && !/#\d{6,}/.test(goal) && !courseId) {
    return NextResponse.json(
      { error: 'Select a canonical program/course or include its approved #INTraining identifier in the goal.' },
      { status: 400 },
    );
  }

  if (!courseId || !programSlug) return NextResponse.json(
    {error:'Select the canonical course and program before queuing the Ultimate builder.'},{status:400});
  if (studioRunId) {
    const {data:ownedRun,error}=await db.from('studio_runs').select('id')
      .eq('id',studioRunId).eq('user_id',auth.id).maybeSingle();
    if(error)throw error;
    if(!ownedRun)return NextResponse.json({error:'Studio run is not owned by this operator'},{status:403});
  }
  const queued=await new DevStudioUltimateCourseControl(db).queueCourse({
    courseId,programSlug,actorId:auth.id,goal,
  });
  if(studioRunId)await recordMasterStudioArtifact(db,{runId:studioRunId,
    stepId:studioRunStepId ?? undefined,type:'ultimate-course-command',name:goal,status:'generated',
    metadata:{courseId,buildId:queued.build.id,jobId:queued.job.id,status:queued.job.status},
    evidence:[{source:'ultimate-build-jobs',captured_at:new Date().toISOString()}]});
  return NextResponse.json({ok:true,queued:true,authority:'ultimate-course-builder',
    courseId,buildId:queued.build.id,jobId:queued.job.id,reused:queued.reused,status:queued.job.status},
    {status:202});
}

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  const buildId = text(req.nextUrl.searchParams.get('buildId'));
  if(buildId) return NextResponse.json({ok:true,...await new DevStudioUltimateCourseControl(await requireAdminClient()).status(buildId)});
  const projectId = text(req.nextUrl.searchParams.get('projectId'));
  if (!projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 });

  const project = await loadAgenticProject({ projectId, userId: auth.id });
  if (!project || project.target_type !== 'course') {
    return NextResponse.json({ error: 'Course agent project not found.' }, { status: 404 });
  }

  const db = await requireAdminClient();
  const { data: run, error: runError } = await db
    .from('agentic_build_runs')
    .select('id,status,prompt,plan,credits_used,error,started_at,completed_at,failed_at')
    .eq('project_id', project.id)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (runError) throw runError;

  // Historical agentic runs are read-only; active commands use Ultimate.

  let tasks: any[] = [];
  if (run?.id) {
    const { data, error } = await db
      .from('agentic_build_tasks')
      .select('id,worker,action,dependencies,status,input,output,error,cost_class,requires_approval,started_at,completed_at,created_at')
      .eq('run_id', run.id)
      .order('created_at', { ascending: true });
    if (error) throw error;
    tasks = data ?? [];
  }

  const [messages, events] = await Promise.all([
    listAgenticMessages(project.id, 100),
    listAgenticEvents(project.id, 100),
  ]);

  let course: Record<string, unknown> | null = null;
  let media: Record<string, number> | null = null;
  if (project.target_id) {
    const { data: row } = await db
      .from('courses')
      .select('id,title,slug,status,is_active,generation_status,generation_progress,review_status,reviewed_by,reviewed_at,total_lessons')
      .eq('id', project.target_id)
      .maybeSingle();
    course = row ?? null;

    const { data: jobs } = await db
      .from('video_jobs')
      .select('asset_kind,status,video_url')
      .eq('course_id', project.target_id);
    const rows = jobs ?? [];
    media = {
      lessonQueued: rows.filter((job) => (job.asset_kind ?? 'lesson') === 'lesson' && job.status === 'queued').length,
      lessonRendering: rows.filter((job) => (job.asset_kind ?? 'lesson') === 'lesson' && job.status === 'rendering').length,
      lessonComplete: rows.filter((job) => (job.asset_kind ?? 'lesson') === 'lesson' && job.status === 'complete' && Boolean(job.video_url)).length,
      microclipQueued: rows.filter((job) => job.asset_kind === 'microclip' && job.status === 'queued').length,
      microclipRendering: rows.filter((job) => job.asset_kind === 'microclip' && job.status === 'rendering').length,
      microclipComplete: rows.filter((job) => job.asset_kind === 'microclip' && job.status === 'complete' && Boolean(job.video_url)).length,
      failed: rows.filter((job) => job.status === 'failed').length,
    };
  }

  return NextResponse.json({
    ok: true,
    project,
    run,
    tasks,
    messages,
    events,
    course,
    media,
  });
}
