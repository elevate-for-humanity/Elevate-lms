import { NextRequest, NextResponse } from 'next/server';

import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import {
  appendAgenticMessage,
  createAgenticProject,
  listAgenticEvents,
  listAgenticMessages,
  loadAgenticProject,
  updateAgenticProjectMetadata,
} from '@/lib/agentic/project-service';
import { startAgenticRun } from '@/lib/agentic/orchestrator';
import { runAgenticExecutorOnce } from '@/lib/agentic/executor';
import { runPersistedCourseProcurementHealthCheckWithClient } from '@/lib/course-builder/persisted-publish-service';

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

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const action = text(body.action) ?? 'start';

  if (action === 'resume-after-review') {
    const projectId = text(body.projectId);
    if (!projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    if (text(body.confirmationText) !== 'CONFIRM COURSE PUBLICATION') {
      return NextResponse.json(
        {
          error: 'Explicit human publication approval is required.',
          requiredConfirmation: 'CONFIRM COURSE PUBLICATION',
        },
        { status: 409 },
      );
    }

    // Status polling also wakes queued work, preventing a cold background timer from stranding runs.
  await runAgenticExecutorOnce();

  const project = await loadAgenticProject({ projectId, userId: auth.id });
    if (!project || project.target_type !== 'course') {
      return NextResponse.json({ error: 'Course agent project not found.' }, { status: 404 });
    }
    if (!project.target_id) {
      return NextResponse.json({ error: 'The agentic project is not linked to a canonical course yet.' }, { status: 409 });
    }

    const db = await requireAdminClient();
    const health = await runPersistedCourseProcurementHealthCheckWithClient(db, project.target_id);
    if (!health.pass) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Course is not ready to resume publication.',
          blocking_issues: health.blocking_issues,
          metrics: health.metrics,
        },
        { status: 422 },
      );
    }

    const { data: run, error: runError } = await db
      .from('agentic_build_runs')
      .select('id,status')
      .eq('project_id', project.id)
      .in('status', ['running', 'waiting_for_approval'])
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (runError) throw runError;
    if (!run) return NextResponse.json({ error: 'No resumable course build run exists.' }, { status: 409 });

    const { data: waitingTasks, error: taskError } = await db
      .from('agentic_build_tasks')
      .select('id,worker,status')
      .eq('run_id', run.id)
      .eq('status', 'waiting_review');
    if (taskError) throw taskError;

    for (const task of waitingTasks ?? []) {
      if (task.worker !== 'compliance-qa') continue;
      const { error } = await db
        .from('agentic_build_tasks')
        .update({
          status: 'completed',
          output: {
            procurement: health.metrics,
            blocking_issues: [],
            human_review_verified: true,
          },
          error: null,
          completed_at: new Date().toISOString(),
        })
        .eq('id', task.id)
        .eq('run_id', run.id);
      if (error) throw error;
    }

    await updateAgenticProjectMetadata({
      project,
      metadata: {
        publication_approved: true,
        publication_approved_by: auth.id,
        publication_approved_at: new Date().toISOString(),
      },
      status: 'active',
    });

    await db.from('agentic_build_events').insert({
      project_id: project.id,
      run_id: run.id,
      event_type: 'agentic.course.publication_approved',
      summary: 'Authorized human review verified; agentic publication may resume.',
      payload: {
        course_id: project.target_id,
        actor_id: auth.id,
        procurement: health.metrics,
      },
    });

    return NextResponse.json({
      ok: true,
      projectId: project.id,
      runId: run.id,
      courseId: project.target_id,
      procurement: health.metrics,
      publicationApproved: true,
    });
  }

  if (action !== 'start') {
    return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
  }

  const goal = text(body.goal);
  let programId = text(body.programId);
  let programSlug = text(body.programSlug);
  let courseId = text(body.courseId);
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
  if (!programId && !programSlug && !/#\d{6,}/.test(goal) && !courseId) {
    return NextResponse.json(
      { error: 'Select a canonical program/course or include its approved #INTraining identifier in the goal.' },
      { status: 400 },
    );
  }

  if (courseId) {
    const { data: existingProject, error: projectError } = await db
      .from('agentic_build_projects')
      .select('*')
      .eq('user_id', auth.id)
      .eq('target_type', 'course')
      .eq('target_id', courseId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (projectError) throw projectError;

    if (existingProject) {
      const { data: existingRun, error: runError } = await db
        .from('agentic_build_runs')
        .select('id,status,plan')
        .eq('project_id', existingProject.id)
        .in('status', ['queued', 'running', 'waiting_for_approval'])
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (runError) throw runError;
      if (existingRun) {
        await appendAgenticMessage({
          projectId: existingProject.id,
          runId: existingRun.id,
          role: 'user',
          content: goal,
          inputMode: 'text',
        });
        await runAgenticExecutorOnce();
        return NextResponse.json({
          ok: true,
          reused: true,
          projectId: existingProject.id,
          runId: existingRun.id,
          courseId,
          plan: existingRun.plan,
        });
      }
    }
  }

  const created = await createAgenticProject({
    targetType: 'course',
    title: text(body.title) ?? goal.slice(0, 120),
    originalPrompt: goal,
    userId: auth.id,
    targetId: courseId,
    metadata: {
      programId,
      programSlug,
      courseId,
      execution_approved: true,
      publication_approved: false,
      source: 'dev_studio_course_agent',
    },
  });

  await appendAgenticMessage({
    projectId: created.project.id,
    role: 'user',
    content: goal,
    inputMode: 'text',
  });

  const started = await startAgenticRun({
    projectId: created.project.id,
    targetType: 'course',
    prompt: goal,
  });

  await appendAgenticMessage({
    projectId: created.project.id,
    runId: started.run.id,
    role: 'assistant',
    content: started.plan.summary,
    metadata: { task_count: started.plan.tasks.length },
  });

  // Wake the durable executor immediately; its claim is atomic and safe alongside the background poller.
  await runAgenticExecutorOnce();

  return NextResponse.json({
    ok: true,
    projectId: created.project.id,
    runId: started.run.id,
    plan: started.plan,
  });
}

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  const projectId = text(req.nextUrl.searchParams.get('projectId'));
  if (!projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 });

  // Await one atomic executor pass so status polling durably advances queued work.
  await runAgenticExecutorOnce();

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
