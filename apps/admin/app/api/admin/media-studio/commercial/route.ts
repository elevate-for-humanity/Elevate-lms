import fs from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { apiRequireAdmin } from '@/lib/admin/guards';
import { resolveAdminOrganization } from '@/lib/admin/resolve-admin-organization';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import {
  createCommercialPlan,
  commercialBriefSchema,
  commercialPlanSchema,
  reviseCommercialPlan,
} from '@/lib/media/commercial-plan';
import {
  cleanupCommercialRender,
  renderCommercialVideo,
} from '@/lib/media/commercial-renderer';
import { persistStudioAsset } from '@/lib/media/studio-assets';
import {
  createJob,
  logJobEvent,
  updateJobStatus,
} from '@/lib/devstudio/job-queue';
import { hydrateProcessEnv } from '@/lib/secrets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const requestSchema = commercialBriefSchema.extend({
  action: z.enum(['plan', 'revise', 'render']).default('render'),
  existingPlan: commercialPlanSchema.optional(),
  instruction: z.string().trim().min(3).max(1_500).optional(),
});

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const raw = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid commercial request.', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  let actor: Awaited<ReturnType<typeof resolveAdminOrganization>>;
  try {
    actor = await resolveAdminOrganization(auth);
  } catch (error) {
    return safeError(error instanceof Error ? error.message : 'Unable to resolve organization.', 403);
  }

  let jobId: string | undefined;
  let tempDir: string | undefined;

  try {
    await hydrateProcessEnv();
    const { action, existingPlan, instruction, ...briefInput } = parsed.data;
    const brief = commercialBriefSchema.parse(briefInput);

    if (action === 'plan') {
      const created = await createCommercialPlan(brief);
      return NextResponse.json({ ok: true, brief: created.brief, plan: created.plan });
    }

    if (action === 'revise') {
      if (!existingPlan || !instruction) {
        return safeError('A storyboard and edit instruction are required to revise a commercial.', 400);
      }
      const plan = await reviseCommercialPlan({ brief, plan: existingPlan, instruction });
      return NextResponse.json({ ok: true, brief, plan });
    }

    const plan = existingPlan ?? (await createCommercialPlan(brief)).plan;

    const job = await createJob({
      organizationId: actor.organizationId,
      jobType: 'content_generation',
      createdBy: actor.userId,
      priority: 7,
      payload: {
        kind: 'commercial-video',
        projectName: brief.projectName,
        title: brief.title,
        durationSeconds: brief.durationSeconds,
        aspectRatio: brief.aspectRatio,
        sourceMode: brief.sourceMode,
      },
    });
    jobId = job?.id;

    if (jobId) {
      await updateJobStatus(jobId, 'running');
      await logJobEvent(jobId, 'started', 'Commercial render started.', {
        sceneCount: plan.scenes.length,
        sourceMode: brief.sourceMode,
      });
    }

    const rendered = await renderCommercialVideo(plan, brief);
    tempDir = rendered.tempDir;
    const buffer = await fs.readFile(rendered.outputPath);

    const saved = await persistStudioAsset({
      organizationId: actor.organizationId,
      userId: actor.userId,
      projectName: brief.projectName,
      fileName: `${brief.title}-${brief.aspectRatio.replace(':', 'x')}.mp4`,
      buffer,
      contentType: 'video/mp4',
      type: 'video',
      title: brief.title,
      durationSeconds: rendered.durationSeconds,
      transcript: rendered.transcript,
      metadata: {
        kind: 'commercial-video',
        prompt: brief.prompt,
        audience: brief.audience,
        objective: brief.objective,
        cta: brief.cta,
        aspect_ratio: brief.aspectRatio,
        source_mode: brief.sourceMode,
        tone: brief.tone,
        voice: brief.voice,
        captions: brief.includeCaptions,
        generated_scene_count: rendered.generatedSceneCount,
        stock_scene_count: rendered.stockSceneCount,
        storyboard: plan,
        job_id: jobId ?? null,
      },
    });

    if (jobId) {
      await logJobEvent(jobId, 'completed', 'Commercial render completed.', {
        assetId: saved.asset.id,
        durationSeconds: rendered.durationSeconds,
        generatedSceneCount: rendered.generatedSceneCount,
        stockSceneCount: rendered.stockSceneCount,
      });
      await updateJobStatus(jobId, 'succeeded', {
        assetId: saved.asset.id,
        publicUrl: saved.publicUrl,
      });
    }

    return NextResponse.json(
      {
        ok: true,
        jobId,
        brief,
        plan,
        asset: saved.asset,
        publicUrl: saved.publicUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    if (jobId) {
      const message = error instanceof Error ? error.message : 'Commercial render failed.';
      await logJobEvent(jobId, 'failed', message).catch(() => undefined);
      await updateJobStatus(jobId, 'failed', undefined, message).catch(() => undefined);
    }
    return safeInternalError(error, 'Commercial video generation failed');
  } finally {
    if (tempDir) await cleanupCommercialRender(tempDir).catch(() => undefined);
  }
}
