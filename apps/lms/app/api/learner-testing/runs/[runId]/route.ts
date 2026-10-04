import { NextRequest, NextResponse } from 'next/server';
import { loadOwnedLearnerTest } from '@/lib/ultimate-course-builder/testing/test-run-access';
import {
  scoreLessonQuestions,
  publicBlueprint,
  validTestCredential,
  signLearnerEvidence,
} from '@/lib/ultimate-course-builder/testing/learner-test-policy';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createHash, randomUUID } from 'node:crypto';
import {
  saveStagedProgress,
  stagedPracticalComplete,
  submitStagedPractical,
  reviewStagedPractical,
} from '@/lib/ultimate-course-builder/testing/staged-practical';
import { logger } from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
type Params = { params: Promise<{ runId: string }> };
const response = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
export async function GET(_req: NextRequest, { params }: Params) {
  const access = await loadOwnedLearnerTest((await params).runId);
  if (!access) return response({ error: 'Unauthorized' }, 401);
  return response({
    progress: access.run.progress,
    snapshot: { ...access.run.snapshot, blueprint: publicBlueprint(access.run.snapshot.blueprint) },
  });
}
export async function POST(req: NextRequest, { params }: Params) {
  const access = await loadOwnedLearnerTest((await params).runId);
  if (!access) return response({ error: 'Unauthorized' }, 401);
  try {
    const { run, db } = access;
    if (run.snapshot.qaOnly === true && access.user.app_metadata?.run_id !== run.id)
      return response({ error: 'QA identity does not match run' }, 403);
    if (req.headers.get('content-type')?.includes('multipart/form-data')) {
      if (run.snapshot.qaOnly !== true || !run.snapshot.practicalRequired)
        return response({ error: 'Marked QA practical run required' }, 403);
      const form = await req.formData(),
        file = form.get('evidence');
      if (
        !(file instanceof File) ||
        file.type !== 'image/png' ||
        file.size < 8 ||
        file.size > 5 * 1024 * 1024
      )
        return response({ error: 'QA PNG artifact required, maximum 5 MB' }, 400);
      const bytes = Buffer.from(await file.arrayBuffer());
      if (!bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
        return response({ error: 'Invalid PNG artifact' }, 400);
      const id = randomUUID(),
        path = `${run.id}/practical/${id}.png`;
      const artifact = {
        id,
        path,
        bucket: 'ultimate-learner-evidence',
        runId: run.id,
        lessonBuildId: run.lesson_build_id,
        artifactHash: run.artifact_hash,
        sha256: createHash('sha256').update(bytes).digest('hex'),
        bytes: bytes.length,
        syntheticQA: true,
        createdAt: new Date().toISOString(),
      };
      const { error } = await db.storage
        .from('ultimate-learner-evidence')
        .upload(path, bytes, { contentType: 'image/png', upsert: false });
      if (error) throw error;
      try {
        await saveStagedProgress(db, run, {
          ...run.progress,
          qaPracticalArtifacts: [...(run.progress.qaPracticalArtifacts ?? []), artifact],
        });
      } catch (error) {
        await db.storage.from('ultimate-learner-evidence').remove([path]);
        throw error;
      }
      return response({ artifact });
    }
    const input = await req.json();
    const p = { ...run.progress },
      b = run.snapshot.blueprint;
    if (input.action === 'practical_submit') {
      const progress = submitStagedPractical(run, input);
      await saveStagedProgress(db, run, progress);
      return response({ progress });
    } else if (input.action === 'progress') {
      const position = Number(input.position),
        duration = Number(input.duration);
      if (
        !Number.isFinite(position) ||
        !Number.isFinite(duration) ||
        duration <= 0 ||
        position < 0 ||
        position > duration + 1
      )
        return response({ error: 'Invalid playback progress' }, 400);
      const now = Date.now(),
        elapsed = p.playbackAt ? (now - p.playbackAt) / 1000 : 0;
      // Seeking does not count as watched time; never infer completion from position alone.
      const advance = position - Number(p.position ?? 0);
      p.watchedSeconds =
        Number(p.watchedSeconds ?? 0) +
        (advance > 0 && advance <= elapsed + 2 ? Math.min(advance, elapsed) : 0);
      p.position = position;
      p.duration = duration;
      p.playbackAt = now;
    } else if (input.action === 'activity') {
      const activity = b.activities.find((a: any) => a.id === input.activityId);
      if (
        !activity ||
        !['guided_practice', 'independent_practice', 'knowledge_check'].includes(activity.type) ||
        typeof input.answer !== 'string' ||
        input.answer.trim().length < 20 ||
        input.answer.length > 10000
      )
        return response({ error: 'An authored activity and written response are required' }, 400);
      p.activities = {
        ...p.activities,
        [activity.id]: { answer: input.answer.trim(), submittedAt: new Date().toISOString() },
      };
    } else if (input.action === 'scenario') {
      if (!b.mistakes?.length || ![0, 1].includes(input.choice))
        return response({ error: 'Authored scenario choice required' }, 400);
      p.scenario = { passed: input.choice === 1, feedback: b.mistakes[0].reason };
    } else if (['assessment', 'reassessment'].includes(input.action)) {
      if (
        input.action === 'reassessment' &&
        (!p.assessment || p.assessment.passed || !p.remediationReviewed)
      )
        return response({ error: 'Complete required remediation first' }, 409);
      const questions =
        input.action === 'assessment' ? b.assessment.questions : b.assessment.reassessment;
      if (!Array.isArray(input.responses)) return response({ error: 'Answers required' }, 400);
      p[input.action] = scoreLessonQuestions(questions, input.responses, b.assessment.passingScore);
    } else if (input.action === 'remediation') {
      if (!p.assessment || p.assessment.passed)
        return response({ error: 'Remediation requires a failed attempt' }, 409);
      p.remediationReviewed = true;
    } else if (input.action === 'complete') {
      const required = b.activities.filter((a: any) =>
        ['guided_practice', 'independent_practice'].includes(a.type),
      );
      if (!stagedPracticalComplete(run.snapshot, p))
        return response(
          {
            error:
              'QA practical submission requires a current policy-approved review; no real competency is awarded',
          },
          409,
        );
      if (
        Number(p.watchedSeconds) < Number(p.duration) * 0.95 ||
        !p.duration ||
        !p.scenario?.passed ||
        !(p.assessment?.passed || p.reassessment?.passed) ||
        required.some((a: any) => !p.activities?.[a.id])
      )
        return response({ error: 'Finish video, practice, and assessment before completion' }, 409);
      p.completed = true;
    } else return response({ error: 'Unknown learner action' }, 400);
    await saveStagedProgress(db, run, p);
    return response({ progress: p });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('PRACTICAL_'))
      return response({ error: error.message }, 409);
    logger.error('Staged learner action failed', error);
    return response({ error: 'Learner action failed' }, 500);
  }
}
// AUTH: signed evidence from the internal browser runner, tied to this test snapshot.
export async function PUT(req: NextRequest, { params }: Params) {
  const secret = process.env.ULTIMATE_LEARNER_RUNTHROUGH_SECRET;
  if (!validTestCredential(req.headers.get('authorization')?.replace(/^Bearer /, '') ?? '', secret))
    return response({ error: 'Unauthorized' }, 401);
  const db = await requireAdminClient();
  const { data: run } = await db
    .from('ultimate_learner_test_runs')
    .select('lesson_build_id,artifact_hash,media_sha256')
    .eq('id', (await params).runId)
    .maybeSingle();
  if (!run) return response({ error: 'Test run not found' }, 404);
  const { evidence, signature } = await req.json();
  if (
    !evidence?.testRunId ||
    evidence.lessonBuildId !== run.lesson_build_id ||
    evidence.artifactHash !== run.artifact_hash ||
    evidence.mediaSha256 !== run.media_sha256 ||
    !validTestCredential(signature, signLearnerEvidence(evidence, secret!))
  )
    return response({ error: 'Evidence mismatch' }, 409);
  const { error } = await db
    .from('ultimate_learner_test_evidence')
    .insert({
      id: evidence.testRunId,
      lesson_build_id: run.lesson_build_id,
      artifact_hash: run.artifact_hash,
      media_sha256: run.media_sha256,
      evidence,
      signature,
    });
  return response(
    error ? { error: 'Evidence persistence failed' } : { ok: true },
    error ? 500 : 200,
  );
}
// AUTH: shared runner credential, scoped only to marked temporary QA identities.
export async function DELETE(req: NextRequest, { params }: Params) {
  if (
    !validTestCredential(
      req.headers.get('authorization')?.replace(/^Bearer /, '') ?? '',
      process.env.ULTIMATE_LEARNER_RUNTHROUGH_SECRET,
    )
  )
    return response({ error: 'Unauthorized' }, 401);
  const db = await requireAdminClient();
  const { data: run } = await db
    .from('ultimate_learner_test_runs')
    .select('learner_id')
    .eq('id', (await params).runId)
    .maybeSingle();
  if (!run) return response({ ok: true });
  const { data: identity } = await db.auth.admin.getUserById(run.learner_id);
  if (identity.user?.app_metadata?.ultimate_learner_test !== true)
    return response({ error: 'Not a test identity' }, 403);
  const { error } = await db.auth.admin.deleteUser(run.learner_id);
  return response(error ? { error: 'Cleanup failed' } : { ok: true }, error ? 500 : 200);
}

// AUTH: service reviewer can review only this marked, unexpired QA run and current submission version.
export async function PATCH(req: NextRequest, { params }: Params) {
  if (
    !validTestCredential(
      req.headers.get('authorization')?.replace(/^Bearer /, '') ?? '',
      process.env.ULTIMATE_LEARNER_RUNTHROUGH_SECRET,
    )
  )
    return response({ error: 'Unauthorized' }, 401);
  const db = await requireAdminClient(),
    runId = (await params).runId;
  const { data: run } = await db
    .from('ultimate_learner_test_runs')
    .select('*')
    .eq('id', runId)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (!run || run.snapshot?.qaOnly !== true)
    return response({ error: 'Marked QA run required' }, 403);
  const { data: identity } = await db.auth.admin.getUserById(run.learner_id);
  if (
    identity.user?.app_metadata?.ultimate_learner_test !== true ||
    identity.user.app_metadata.run_id !== runId
  )
    return response({ error: 'Marked QA identity required' }, 403);
  try {
    const progress = reviewStagedPractical(run, await req.json(), `qa-service:${run.id}`);
    await saveStagedProgress(db, run, progress);
    return response({ progress, syntheticQA: true, realCompetencyAwarded: false });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('PRACTICAL_'))
      return response({ error: error.message }, 409);
    logger.error('Staged QA practical review failed', error);
    return response({ error: 'QA review failed' }, 500);
  }
}
