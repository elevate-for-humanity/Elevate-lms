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
} from '@/lib/agentic/project-service';
import { startAgenticRun } from '@/lib/agentic/orchestrator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const action = text(body.action) ?? 'start';

  if (action !== 'start') {
    return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
  }

  const goal = text(body.goal);
  const programId = text(body.programId);
  const programSlug = text(body.programSlug);
  const courseId = text(body.courseId);
  if (!goal) return NextResponse.json({ error: 'A course build goal is required.' }, { status: 400 });
  if (!programId && !programSlug && !/#\d{6,}/.test(goal) && !courseId) {
    return NextResponse.json(
      { error: 'Select a canonical program/course or include its approved #INTraining identifier in the goal.' },
      { status: 400 },
    );
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
