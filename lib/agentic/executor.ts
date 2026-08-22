import 'server-only';

import fs from 'fs/promises';

import { requireAdminClient } from '@/lib/supabase/admin';
import { createCommercialPlan, type CommercialBrief } from '@/lib/media/commercial-plan';
import { cleanupCommercialRender, renderCommercialVideo } from '@/lib/media/commercial-renderer';
import { persistStudioAsset } from '@/lib/media/studio-assets';

const POLL_MS = 15_000;
const HOME_HERO_KIND = 'homepage-hero-commercial';
let started = false;
let timer: NodeJS.Timeout | null = null;
let polling = false;

function homeHeroBrief(prompt: string): CommercialBrief {
  return {
    projectName: 'Homepage Hero 2026',
    title: 'Choose Your Next Chapter',
    prompt,
    audience:
      'Adults in Indiana exploring career training, registered apprenticeships, career changes, and employer-connected learning',
    objective:
      'Create immediate excitement, show the breadth of career pathways, make apprenticeship tangible, and drive visitors to explore programs or apprenticeships',
    cta: 'Choose Your Next Chapter',
    durationSeconds: 35,
    aspectRatio: '16:9',
    sourceMode: 'hybrid',
    tone: 'cinematic',
    voice: 'coral',
    includeCaptions: false,
  };
}

async function completeTask(taskId: string, output: Record<string, unknown>) {
  const db = await requireAdminClient();
  await db
    .from('agentic_build_tasks')
    .update({
      status: 'completed',
      output,
      completed_at: new Date().toISOString(),
      error: null,
    })
    .eq('id', taskId);
}

async function failTask(taskId: string, runId: string, projectId: string, error: unknown) {
  const db = await requireAdminClient();
  const message = error instanceof Error ? error.message : String(error);
  await db
    .from('agentic_build_tasks')
    .update({ status: 'failed', error: message, completed_at: new Date().toISOString() })
    .eq('id', taskId);
  await db
    .from('agentic_build_runs')
    .update({ status: 'failed', error: message, failed_at: new Date().toISOString() })
    .eq('id', runId);
  await db.from('agentic_build_projects').update({ status: 'failed' }).eq('id', projectId);
  await db.from('agentic_build_events').insert({
    project_id: projectId,
    run_id: runId,
    task_id: taskId,
    event_type: 'agentic.task.failed',
    summary: message,
    payload: {},
  });
}

async function dependencyOutputs(runId: string, dependencyIds: string[]) {
  if (!dependencyIds.length) return [];
  const db = await requireAdminClient();
  const { data } = await db
    .from('agentic_build_tasks')
    .select('id, worker, status, output')
    .eq('run_id', runId)
    .in('id', dependencyIds);
  return data ?? [];
}

async function dependenciesCompleted(runId: string, dependencyIds: string[]) {
  if (!dependencyIds.length) return true;
  const rows = await dependencyOutputs(runId, dependencyIds);
  return rows.length === dependencyIds.length && rows.every((row) => row.status === 'completed');
}

async function claimTask(taskId: string) {
  const db = await requireAdminClient();
  const { data } = await db
    .from('agentic_build_tasks')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', taskId)
    .eq('status', 'queued')
    .select('id')
    .maybeSingle();
  return Boolean(data?.id);
}

async function resolveOrganizationId(tenantId: string | null) {
  if (!tenantId) return null;
  const db = await requireAdminClient();
  const { data } = await db
    .from('organizations')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

async function processMarketingTask(task: any, run: any, project: any) {
  const db = await requireAdminClient();

  if (task.worker === 'visual-designer') {
    await completeTask(task.id, {
      summary: 'Approved cinematic homepage hero visual system prepared.',
      design: {
        format: '16:9 full-bleed cinematic commercial',
        duration_seconds: 35,
        overlay: 'none',
        motion: 'fast readable cuts with restrained animated typography',
        mobile_safe: true,
        scenes: ['Healthcare', 'Skilled Trades', 'Barber & Beauty', 'Business & Technology', 'Earn While You Learn'],
      },
    });
    return;
  }

  if (task.worker === 'media-director') {
    const organizationId = await resolveOrganizationId(project.tenant_id);
    if (!organizationId) throw new Error('No active organization is mapped to the agentic project tenant.');

    const brief = homeHeroBrief(run.prompt);
    const { plan } = await createCommercialPlan(brief);
    const rendered = await renderCommercialVideo(plan, brief);
    try {
      const buffer = await fs.readFile(rendered.outputPath);
      const saved = await persistStudioAsset({
        organizationId,
        userId: project.user_id ?? null,
        projectName: brief.projectName,
        fileName: 'choose-your-next-chapter-16x9.mp4',
        buffer,
        contentType: 'video/mp4',
        type: 'video',
        title: brief.title,
        durationSeconds: rendered.durationSeconds,
        transcript: rendered.transcript,
        metadata: {
          kind: HOME_HERO_KIND,
          agentic_project_id: project.id,
          agentic_run_id: run.id,
          homepage_candidate: true,
          qa_approved: false,
          approved: false,
          storyboard: plan,
          generated_scene_count: rendered.generatedSceneCount,
          stock_scene_count: rendered.stockSceneCount,
        },
      });
      await completeTask(task.id, {
        summary: 'Homepage hero commercial rendered and persisted as a Media Studio asset.',
        asset_id: saved.asset.id,
        public_url: saved.publicUrl,
        duration_seconds: rendered.durationSeconds,
        transcript: rendered.transcript,
      });
    } finally {
      await cleanupCommercialRender(rendered.tempDir).catch(() => undefined);
    }
    return;
  }

  if (task.worker === 'compliance-qa') {
    const deps = await dependencyOutputs(run.id, task.dependencies ?? []);
    const media = deps.find((row: any) => row.worker === 'media-director');
    const assetId = media?.output?.asset_id as string | undefined;
    const publicUrl = media?.output?.public_url as string | undefined;
    if (!assetId || !publicUrl) throw new Error('Rendered hero asset is missing from the Media Director output.');
    if (!/^https:\/\//.test(publicUrl)) throw new Error('Rendered hero asset does not have a secure public URL.');

    const { data: asset, error } = await db
      .from('media_assets')
      .select('id, mime_type, duration_seconds, transcript, metadata')
      .eq('id', assetId)
      .single();
    if (error || !asset) throw new Error('Rendered hero asset could not be loaded for QA.');
    if (asset.mime_type !== 'video/mp4') throw new Error('Homepage hero output is not an MP4 video.');
    if (!asset.duration_seconds || asset.duration_seconds < 25 || asset.duration_seconds > 50) {
      throw new Error('Homepage hero duration is outside the approved commercial range.');
    }
    if (!asset.transcript) throw new Error('Homepage hero is missing its accessibility transcript.');

    await db
      .from('media_assets')
      .update({ metadata: { ...(asset.metadata ?? {}), qa_approved: true } })
      .eq('id', assetId);
    await completeTask(task.id, {
      summary: 'Homepage hero passed media, duration, secure URL, and transcript QA gates.',
      asset_id: assetId,
      public_url: publicUrl,
      qa_approved: true,
    });
    return;
  }

  if (task.worker === 'publisher') {
    const all = await db
      .from('agentic_build_tasks')
      .select('worker, status, output')
      .eq('run_id', run.id);
    const media = (all.data ?? []).find((row: any) => row.worker === 'media-director');
    const qa = (all.data ?? []).find((row: any) => row.worker === 'compliance-qa');
    const assetId = media?.output?.asset_id as string | undefined;
    const publicUrl = media?.output?.public_url as string | undefined;
    if (!assetId || qa?.status !== 'completed' || qa?.output?.qa_approved !== true) {
      throw new Error('Homepage hero cannot publish before successful QA.');
    }
    const { data: asset, error } = await db
      .from('media_assets')
      .select('metadata')
      .eq('id', assetId)
      .single();
    if (error || !asset) throw new Error('Homepage hero media asset is unavailable at publish time.');
    await db
      .from('media_assets')
      .update({
        metadata: {
          ...(asset.metadata ?? {}),
          qa_approved: true,
          approved: true,
          homepage_hero: true,
          published_at: new Date().toISOString(),
        },
      })
      .eq('id', assetId);
    await completeTask(task.id, {
      summary: 'Approved commercial published as the canonical dynamic homepage hero asset.',
      asset_id: assetId,
      public_url: publicUrl,
    });
    await db
      .from('agentic_build_runs')
      .update({ status: 'completed', completed_at: new Date().toISOString(), error: null })
      .eq('id', run.id);
    await db.from('agentic_build_projects').update({ status: 'completed' }).eq('id', project.id);
    await db.from('agentic_build_events').insert({
      project_id: project.id,
      run_id: run.id,
      task_id: task.id,
      event_type: 'agentic.run.completed',
      summary: 'Homepage hero commercial generated, validated, and published.',
      payload: { asset_id: assetId, public_url: publicUrl },
    });
    return;
  }

  throw new Error(`Unsupported marketing campaign worker: ${task.worker}`);
}

async function pollOnce() {
  if (polling) return;
  polling = true;
  try {
    const db = await requireAdminClient();
    const { data: tasks, error } = await db
      .from('agentic_build_tasks')
      .select('id, run_id, worker, action, dependencies, status, requires_approval, created_at')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(10);
    if (error) throw error;

    for (const task of tasks ?? []) {
      if (!(await dependenciesCompleted(task.run_id, task.dependencies ?? []))) continue;
      const { data: run } = await db
        .from('agentic_build_runs')
        .select('id, project_id, prompt, status')
        .eq('id', task.run_id)
        .eq('status', 'running')
        .maybeSingle();
      if (!run) continue;
      const { data: project } = await db
        .from('agentic_build_projects')
        .select('id, tenant_id, user_id, target_type, metadata, status')
        .eq('id', run.project_id)
        .eq('status', 'active')
        .maybeSingle();
      if (!project || project.target_type !== 'marketing_campaign') continue;
      if (task.requires_approval && project.metadata?.execution_approved !== true) continue;
      if (!(await claimTask(task.id))) continue;

      await db.from('agentic_build_events').insert({
        project_id: project.id,
        run_id: run.id,
        task_id: task.id,
        event_type: 'agentic.task.running',
        summary: `${task.worker} started ${task.action}.`,
        payload: {},
      });

      try {
        await processMarketingTask({ ...task, status: 'running' }, run, project);
      } catch (err) {
        await failTask(task.id, run.id, project.id, err);
      }
      break;
    }
  } catch (err) {
    console.error('[agentic-executor] poll failed', err);
  } finally {
    polling = false;
  }
}

export function startAgenticExecutor() {
  if (started || process.env.ELEVATE_SERVICE !== 'admin') return;
  started = true;
  void pollOnce();
  timer = setInterval(() => void pollOnce(), POLL_MS);
  timer.unref?.();
  console.info('[agentic-executor] Admin agentic executor started');
}
