import { NextRequest, NextResponse } from 'next/server';
import { randomUUID, randomBytes } from 'node:crypto';
import { requireAdminClient } from '@/lib/supabase/admin';
import { contractHash, ULTIMATE_LESSON_CONTRACT_VERSION } from '@/lib/ultimate-course-builder/core/lesson-contract';
import { validTestCredential } from '@/lib/ultimate-course-builder/testing/learner-test-policy';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// AUTH: service-to-service bearer credential; ephemeral QA users are never real learners.
export async function POST(req: NextRequest) {
  if (!validTestCredential(req.headers.get('authorization')?.replace(/^Bearer /, '') ?? '', process.env.ULTIMATE_LEARNER_RUNTHROUGH_SECRET))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let createdUserId: string | undefined;
  const db = await requireAdminClient();
  try {
    const input = await req.json();
    if (!/^[0-9a-f-]{36}$/i.test(input.lessonBuildId ?? '')) return NextResponse.json({ error: 'Invalid lesson build' }, { status: 400 });
    const { data: lesson, error } = await db.from('ultimate_lesson_builds')
      .select('id,competency_id,artifacts,ultimate_course_builds!inner(course_id,profile)')
      .eq('id', input.lessonBuildId).single();
    if (error || !lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    const build: any = lesson.ultimate_course_builds;
    const a: any = lesson.artifacts;
    const render = a.lesson_film_render?.render;
    const blueprint = a.learning_objectives?.blueprint;
    const competency = build.profile.competencies.find((c: any) => c.id === lesson.competency_id);
    if (build.course_id !== input.courseId || lesson.competency_id !== input.lessonId ||
        input.contractVersion !== ULTIMATE_LESSON_CONTRACT_VERSION ||
        contractHash(a) !== input.artifactHash || render?.videoUrl !== input.videoUrl ||
        a.finished_media_qa?.mediaQA?.inspection?.mediaSha256 !== input.mediaSha256)
      return NextResponse.json({ error: 'Lesson evidence changed; rerun with current artifacts' }, { status: 409 });
    if (!blueprint?.assessment?.questions?.length || !render.captionsUrl)
      return NextResponse.json({ error: 'Authored lesson and captions required' }, { status: 409 });
    const id = randomUUID(), password = randomBytes(24).toString('base64url') + '!9aA';
    const email = `ultimate-test-${id}@qa.invalid`;
    const { data: account, error: authError } = await db.auth.admin.createUser({ email, password, email_confirm: true,
      app_metadata: { ultimate_learner_test: true, run_id: id }, user_metadata: { full_name: '[QA] Lesson acceptance learner' } });
    if (authError || !account.user) throw authError ?? new Error('Test account creation failed');
    createdUserId = account.user.id;
    const snapshot = { title: competency?.title ?? competency?.description ?? 'Lesson', blueprint, render,
      practicalRequired: competency?.requiresPracticalEvidence === true };
    const { error: saveError } = await db.from('ultimate_learner_test_runs').insert({ id, learner_id: createdUserId,
      lesson_build_id: lesson.id, artifact_hash: input.artifactHash, media_sha256: input.mediaSha256,
      contract_version: input.contractVersion, snapshot });
    if (saveError) throw saveError;
    const { data: session, error: sessionError } = await db.auth.signInWithPassword({ email, password });
    if (sessionError || !session.session) throw sessionError ?? new Error('Test authentication failed');
    return NextResponse.json({ runId: id, accessToken: session.session.access_token, refreshToken: session.session.refresh_token,
      path: `/learner-testing/${id}`, snapshot }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (createdUserId) await db.auth.admin.deleteUser(createdUserId);
    logger.error('Learner test setup failed', error);
    return NextResponse.json({ error: 'Learner test setup failed' }, { status: 500 });
  }
}
