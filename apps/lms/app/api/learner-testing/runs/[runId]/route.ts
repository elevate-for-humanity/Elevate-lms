import { NextRequest, NextResponse } from 'next/server';
import { loadOwnedLearnerTest } from '@/lib/ultimate-course-builder/testing/test-run-access';
import { scoreLessonQuestions, publicBlueprint, validTestCredential, signLearnerEvidence } from '@/lib/ultimate-course-builder/testing/learner-test-policy';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
type Params = { params: Promise<{ runId: string }> };
const response = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
export async function GET(_req: NextRequest, { params }: Params) {
  const access = await loadOwnedLearnerTest((await params).runId);
  if (!access) return response({ error: 'Unauthorized' }, 401);
  return response({ progress: access.run.progress, snapshot: { ...access.run.snapshot, blueprint: publicBlueprint(access.run.snapshot.blueprint) } });
}
export async function POST(req: NextRequest, { params }: Params) {
  const access = await loadOwnedLearnerTest((await params).runId);
  if (!access) return response({ error: 'Unauthorized' }, 401);
  try {
    const input = await req.json(), { run, db } = access;
    const p = { ...run.progress }, b = run.snapshot.blueprint;
    if (input.action === 'progress') {
      const position = Number(input.position), duration = Number(input.duration);
      if (!Number.isFinite(position) || !Number.isFinite(duration) || duration <= 0 || position < 0 || position > duration + 1)
        return response({ error: 'Invalid playback progress' }, 400);
      const now = Date.now(), elapsed = p.playbackAt ? (now - p.playbackAt) / 1000 : 0;
      // Seeking does not count as watched time; never infer completion from position alone.
      const advance = position - Number(p.position ?? 0);
      p.watchedSeconds = Number(p.watchedSeconds ?? 0) + (advance > 0 && advance <= elapsed + 2 ? Math.min(advance, elapsed) : 0);
      p.position = position; p.duration = duration; p.playbackAt = now;
    } else if (input.action === 'activity') {
      const activity = b.activities.find((a: any) => a.id === input.activityId);
      if (!activity || !['guided_practice', 'independent_practice', 'knowledge_check'].includes(activity.type) || typeof input.answer !== 'string' || input.answer.trim().length < 20 || input.answer.length > 10000)
        return response({ error: 'An authored activity and written response are required' }, 400);
      p.activities = { ...p.activities, [activity.id]: { answer: input.answer.trim(), submittedAt: new Date().toISOString() } };
    } else if (input.action === 'scenario') {
      if (!b.mistakes?.length || ![0, 1].includes(input.choice)) return response({ error: 'Authored scenario choice required' }, 400);
      p.scenario = { passed: input.choice === 1, feedback: b.mistakes[0].reason };
    } else if (['assessment', 'reassessment'].includes(input.action)) {
      if (input.action === 'reassessment' && (!p.assessment || p.assessment.passed || !p.remediationReviewed))
        return response({ error: 'Complete required remediation first' }, 409);
      const questions = input.action === 'assessment' ? b.assessment.questions : b.assessment.reassessment;
      if (!Array.isArray(input.responses)) return response({ error: 'Answers required' }, 400);
      p[input.action] = scoreLessonQuestions(questions, input.responses, b.assessment.passingScore);
    } else if (input.action === 'remediation') {
      if (!p.assessment || p.assessment.passed) return response({ error: 'Remediation requires a failed attempt' }, 409);
      p.remediationReviewed = true;
    } else if (input.action === 'complete') {
      const required = b.activities.filter((a: any) => ['guided_practice', 'independent_practice'].includes(a.type));
      if (run.snapshot.practicalRequired) return response({ error: 'Practical evidence requires its real evaluation workflow; written practice cannot substitute' }, 409);
      if (Number(p.watchedSeconds) < Number(p.duration) * 0.95 || !p.duration ||
          !p.scenario?.passed || !(p.assessment?.passed || p.reassessment?.passed) || required.some((a: any) => !p.activities?.[a.id]))
        return response({ error: 'Finish video, practice, and assessment before completion' }, 409);
      p.completed = true;
    } else return response({ error: 'Unknown learner action' }, 400);
    const { error } = await db.from('ultimate_learner_test_runs').update({ progress: p }).eq('id', run.id).eq('learner_id', access.user.id);
    if (error) throw error;
    return response({ progress: p });
  } catch (error) { logger.error('Staged learner action failed', error); return response({ error: 'Learner action failed' }, 500); }
}
// AUTH: signed evidence from the internal browser runner, tied to this test snapshot.
export async function PUT(req: NextRequest, { params }: Params) {
  const secret = process.env.ULTIMATE_LEARNER_RUNTHROUGH_SECRET;
  if (!validTestCredential(req.headers.get('authorization')?.replace(/^Bearer /, '') ?? '', secret)) return response({ error: 'Unauthorized' }, 401);
  const db = await requireAdminClient();
  const { data: run } = await db.from('ultimate_learner_test_runs').select('lesson_build_id,artifact_hash,media_sha256').eq('id', (await params).runId).maybeSingle();
  if (!run) return response({ error: 'Test run not found' }, 404);
  const { evidence, signature } = await req.json();
  if (!evidence?.testRunId || evidence.lessonBuildId !== run.lesson_build_id || evidence.artifactHash !== run.artifact_hash || evidence.mediaSha256 !== run.media_sha256 ||
      !validTestCredential(signature, signLearnerEvidence(evidence, secret!))) return response({ error: 'Evidence mismatch' }, 409);
  const { error } = await db.from('ultimate_learner_test_evidence').insert({ id: evidence.testRunId, lesson_build_id: run.lesson_build_id,
    artifact_hash: run.artifact_hash, media_sha256: run.media_sha256, evidence, signature });
  return response(error ? { error: 'Evidence persistence failed' } : { ok: true }, error ? 500 : 200);
}
// AUTH: shared runner credential, scoped only to marked temporary QA identities.
export async function DELETE(req: NextRequest, { params }: Params) {
  if (!validTestCredential(req.headers.get('authorization')?.replace(/^Bearer /, '') ?? '', process.env.ULTIMATE_LEARNER_RUNTHROUGH_SECRET)) return response({ error: 'Unauthorized' }, 401);
  const db = await requireAdminClient();
  const { data: run } = await db.from('ultimate_learner_test_runs').select('learner_id').eq('id', (await params).runId).maybeSingle();
  if (!run) return response({ ok: true });
  const { data: identity } = await db.auth.admin.getUserById(run.learner_id);
  if (identity.user?.app_metadata?.ultimate_learner_test !== true) return response({ error: 'Not a test identity' }, 403);
  const { error } = await db.auth.admin.deleteUser(run.learner_id);
  return response(error ? { error: 'Cleanup failed' } : { ok: true }, error ? 500 : 200);
}
